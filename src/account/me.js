// GET /api/account/me — everything the dashboard shows for the signed-in customer.
// Card + payments come from Stripe. Property and schedule details come from the
// CRM sheet through the Make.com scenario (optional; the page works without it).
import { json, getSession, stripe, sendToMake } from "./lib.js";

function cardSummary(pm) {
  if (!pm || !pm.card) return null;
  return {
    brand: pm.card.brand,
    last4: pm.card.last4,
    exp_month: pm.card.exp_month,
    exp_year: pm.card.exp_year,
  };
}

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (!session) return json({ signed_in: false }, 401);

  try {
    const customer = await stripe(env, "GET", `/v1/customers/${session.cid}`, {
      "expand[]": "invoice_settings.default_payment_method",
    });
    if (customer.deleted) return json({ signed_in: false }, 401);

    let card = cardSummary(customer.invoice_settings?.default_payment_method);
    if (!card) {
      const pms = await stripe(env, "GET", `/v1/customers/${session.cid}/payment_methods`, { type: "card", limit: 1 });
      card = cardSummary(pms.data?.[0]);
    }

    const charges = await stripe(env, "GET", "/v1/charges", { customer: session.cid, limit: 12 });
    const payments = (charges.data || []).map((c) => ({
      date: new Date(c.created * 1000).toISOString(),
      amount: c.amount / 100,
      currency: c.currency,
      status: c.refunded ? "refunded" : c.status,
      description: c.description || "Lawn service",
      receipt_url: c.receipt_url || null,
    }));

    let property = null;
    try {
      const crm = await sendToMake(
        env,
        "account_lookup",
        { email: session.email, stripe_customer_id: session.cid },
        { expectResponse: true }
      );
      if (crm && typeof crm === "object") {
        const pick = (k) => (crm[k] === undefined || crm[k] === null ? "" : String(crm[k]));
        property = {
          first_name: pick("first_name"),
          service_address: pick("service_address"),
          city: pick("city"),
          zip: pick("zip"),
          frequency: pick("frequency"),
          services: pick("services"),
          access_notes: pick("access_notes"),
          status: pick("status"),
          next_service_date: pick("next_service_date"),
        };
      }
    } catch (err) {
      console.error("CRM lookup failed", err); // dashboard still loads with Stripe data
    }

    return json({
      signed_in: true,
      email: session.email,
      name: customer.name || property?.first_name || "",
      card,
      payments,
      property,
    });
  } catch (err) {
    console.error("me error", err);
    return json({ error: "We couldn't load your account right now." }, 500);
  }
}
