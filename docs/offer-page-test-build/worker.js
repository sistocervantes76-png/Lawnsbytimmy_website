/**
 * Cloudflare Worker — Lawns by Timmy offer-page payments
 * ---------------------------------------------------------------------------
 * Payment Element flow (matches local server.mjs):
 *   create Customer + unconfirmed PaymentIntent (setup_future_usage=off_session)
 *   return client_secret for Stripe.js confirmPayment on the page.
 *
 * Bind secrets (wrangler secret put):
 *   STRIPE_SECRET_KEY          // sk_test_...  NEVER sk_live_
 *   STRIPE_OFFER_PRICE_ID      // price_... small-yard bi-weekly ($45)
 *   STRIPE_PACKAGE_PRICE_ID    // price_... 4-visit package ($154)
 *   STRIPE_OFFER_ZONE2_PRICE_ID // price_... small-yard bi-weekly zone 2 ($55)
 *   STRIPE_OFFER_ZONE2_AMOUNT_CENTS // default 5500
 * Optional:
 *   STRIPE_PUBLISHABLE_KEY     // pk_test_... for /api/config
 *   STRIPE_OFFER_AMOUNT_CENTS  // default 4500
 *   STRIPE_PACKAGE_AMOUNT_CENTS // default 15400
 *
 * Deploy: wrangler deploy  (not done from this test task)
 * Local:  wrangler dev
 *
 * This stub REFUSES live keys. It never creates products — pass price IDs / amounts.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    if (url.pathname === "/api/create-checkout-session" && request.method === "POST") {
      // Back-compat alias → Payment Element PaymentIntent
      return createPaymentIntent(request, env);
    }

    if (url.pathname === "/api/create-payment-intent" && request.method === "POST") {
      return createPaymentIntent(request, env);
    }

    if (url.pathname === "/api/update-payment-intent" && request.method === "POST") {
      return updatePaymentIntent(request, env);
    }

    if (url.pathname === "/api/payment-status" && request.method === "GET") {
      return paymentStatus(url, env);
    }

    if (url.pathname === "/api/config" && request.method === "GET") {
      const pk = env.STRIPE_PUBLISHABLE_KEY || "";
      return json({
        checkout_mode: "payment_element",
        publishableKey: pk.startsWith("pk_test_") ? pk : "",
        offer_price: env.STRIPE_OFFER_PRICE_ID || null,
        package_price: env.STRIPE_PACKAGE_PRICE_ID || null,
        offer_amount_cents: amountCents(env, false),
        package_amount_cents: amountCents(env, true),
        has_publishable_key: pk.startsWith("pk_test_")
      });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, mode: keyMode(env.STRIPE_SECRET_KEY) });
    }

    return json({ error: "not_found" }, 404);
  }
};

function keyMode(secret) {
  if (!secret) return "missing";
  if (String(secret).startsWith("sk_live_")) return "live_refused";
  if (String(secret).startsWith("sk_test_")) return "test";
  return "unknown";
}

const ZONE2_ZIPS = ["33301", "33304", "33305", "33306", "33308", "33313", "33316"];
// Zone 2 (Sisto, Nov 7 2026): per-visit $55 ($45 + $10 trip fee); package $154 everywhere.
function isZone2(zip) { return ZONE2_ZIPS.includes(String(zip || "").replace(/\D/g, "").slice(0, 5)); }

function amountCents(env, usePackage, zone2 = false) {
  if (usePackage) {
    const n = Number(env.STRIPE_PACKAGE_AMOUNT_CENTS || 15400);
    return Number.isFinite(n) && n > 0 ? n : 15400;
  }
  if (zone2) {
    const z = Number(env.STRIPE_OFFER_ZONE2_AMOUNT_CENTS || 5500);
    return Number.isFinite(z) && z > 0 ? z : 5500;
  }
  const n = Number(env.STRIPE_OFFER_AMOUNT_CENTS || 4500);
  return Number.isFinite(n) && n > 0 ? n : 4500;
}

async function stripe(env, pathname, method = "GET", form = null) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
  };
  if (form) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = form.toString();
  }
  const res = await fetch("https://api.stripe.com/v1" + pathname, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function createPaymentIntent(request, env) {
  const mode = keyMode(env.STRIPE_SECRET_KEY);
  if (mode === "live_refused") {
    return json({ error: "live_stripe_keys_refused_use_sk_test" }, 403);
  }
  if (mode !== "test") {
    return json({
      mock: true,
      clientSecret: null,
      message: "STRIPE_SECRET_KEY (sk_test_...) not set. Front end should render card mock."
    });
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const usePackage = !!body.upsell;
  const zone2 = !usePackage && isZone2(body.zip);
  const amount = amountCents(env, usePackage, zone2);
  const offerId = body.offer_id || (usePackage ? "prepaid_4_visits" : "small_yard_biweekly");
  const saveCard = body.save_card !== false;
  const priceId = usePackage
    ? (env.STRIPE_PACKAGE_PRICE_ID || body.price_id || "")
    : zone2
      ? (env.STRIPE_OFFER_ZONE2_PRICE_ID || "")
      : (env.STRIPE_OFFER_PRICE_ID || body.price_id || "");

  const crmCustomerId = String(body.crm_customer_id || body.customer?.crm_customer_id || body.metadata?.crm_customer_id || "").trim();
  const custParams = new URLSearchParams();
  custParams.set("metadata[business]", "lawns_by_timmy");
  if (crmCustomerId) custParams.set("metadata[crm_customer_id]", crmCustomerId);
  if (body.customer?.name) custParams.set("name", body.customer.name);
  if (body.customer?.phone) custParams.set("phone", body.customer.phone);
  if (body.customer?.email) custParams.set("email", body.customer.email);
  // Do not invent a test email when the customer did not provide one.
  custParams.set("metadata[source]", "offer-page");
  custParams.set("metadata[address]", String(body.customer?.address || "").slice(0, 450));
  const cust = await stripe(env, "/customers", "POST", custParams);
  if (!cust.ok) {
    return json({ error: cust.data.error?.message || "customer_failed", detail: cust.data.error }, 502);
  }

  const piParams = new URLSearchParams();
  piParams.set("metadata[business]", "lawns_by_timmy");
  if (crmCustomerId) piParams.set("metadata[crm_customer_id]", crmCustomerId);
  piParams.set("amount", String(amount));
  piParams.set("currency", "usd");
  piParams.set("customer", cust.data.id);
  piParams.set("payment_method_types[0]", "card");
  if (saveCard) piParams.set("setup_future_usage", "off_session");
  piParams.set(
    "description",
    usePackage ? "4-visit package $154 (first visit $19, then 3 at $45; recurring only)" : (zone2 ? "Small-yard bi-weekly visit $55 incl. $10 trip fee (recurring only)" : "Small-yard bi-weekly visit $45 (recurring only)")
  );
  piParams.set("metadata[source]", "sisto-2026-11-05");
  piParams.set("metadata[placeholder]", "false");
  piParams.set("metadata[recurring_only]", "true");
  piParams.set("metadata[offer_id]", offerId);
  if (priceId) piParams.set("metadata[price_id]", priceId);
  piParams.set("metadata[address]", String(body.customer?.address || "").slice(0, 450));

  const pi = await stripe(env, "/payment_intents", "POST", piParams);
  if (!pi.ok) {
    return json({ error: pi.data.error?.message || "pi_REDACTED", detail: pi.data.error }, 502);
  }

  return json({
    mock: false,
    mode: "payment_element",
    clientSecret: pi.data.client_secret,
    payment_intent_id: pi.data.id,
    customer_id: cust.data.id,
    amount,
    currency: "usd",
    setup_future_usage: pi.data.setup_future_usage || null,
    offer_id: offerId
  });
}

async function updatePaymentIntent(request, env) {
  const mode = keyMode(env.STRIPE_SECRET_KEY);
  if (mode === "live_refused") {
    return json({ error: "live_stripe_keys_refused_use_sk_test" }, 403);
  }
  if (mode !== "test") {
    return json({ error: "missing_test_key" }, 400);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const piId = body.payment_intent_id;
  if (!piId || !String(piId).startsWith("pi_")) {
    return json({ error: "payment_intent_id required" }, 400);
  }

  const usePackage = !!body.upsell;
  const zone2 = !usePackage && isZone2(body.zip);
  const amount = amountCents(env, usePackage, zone2);
  const offerId = body.offer_id || (usePackage ? "prepaid_4_visits" : "small_yard_biweekly");
  const params = new URLSearchParams();
  params.set("amount", String(amount));
  params.set(
    "description",
    usePackage ? "4-visit package $154 (first visit $19, then 3 at $45; recurring only)" : (zone2 ? "Small-yard bi-weekly visit $55 incl. $10 trip fee (recurring only)" : "Small-yard bi-weekly visit $45 (recurring only)")
  );
  params.set("metadata[offer_id]", offerId);
  params.set("metadata[placeholder]", "false");
  params.set("metadata[source]", "sisto-2026-11-05");
  params.set("metadata[recurring_only]", "true");
  if (body.save_card !== false) params.set("setup_future_usage", "off_session");

  const pi = await stripe(env, `/payment_intents/${piId}`, "POST", params);
  if (!pi.ok) {
    return json({ error: pi.data.error?.message || "pi_REDACTED_failed", detail: pi.data.error }, 502);
  }

  return json({
    mock: false,
    mode: "payment_element",
    clientSecret: pi.data.client_secret,
    payment_intent_id: pi.data.id,
    customer_id: typeof pi.data.customer === "string" ? pi.data.customer : pi.data.customer?.id,
    amount,
    currency: "usd",
    setup_future_usage: pi.data.setup_future_usage || null,
    offer_id: offerId
  });
}

async function paymentStatus(url, env) {
  const mode = keyMode(env.STRIPE_SECRET_KEY);
  if (mode === "live_refused") {
    return json({ error: "live_stripe_keys_refused_use_sk_test" }, 403);
  }
  if (mode !== "test") {
    return json({ error: "missing_test_key" }, 400);
  }
  const piId = url.searchParams.get("payment_intent");
  if (!piId || !String(piId).startsWith("pi_")) {
    return json({ error: "pi_ id required" }, 400);
  }
  const { ok, data } = await stripe(
    env,
    `/payment_intents/${piId}?expand[]=payment_method&expand[]=customer`
  );
  if (!ok) return json({ error: data.error?.message }, 502);
  const pm = data.payment_method;
  const customerId = typeof data.customer === "object" ? data.customer?.id : data.customer;
  let saved = [];
  if (customerId) {
    const list = await stripe(env, `/customers/${customerId}/payment_methods?type=card&limit=5`);
    saved = (list.data.data || []).map((x) => ({
      id: x.id,
      last4: x.card?.last4,
      brand: x.card?.brand
    }));
  }
  return json({
    payment_intent_id: data.id,
    status: data.status,
    amount: data.amount,
    customer_id: customerId,
    last4: pm?.card?.last4 || saved[0]?.last4 || null,
    brand: pm?.card?.brand || saved[0]?.brand || null,
    payment_method_id: typeof pm === "object" ? pm?.id : data.payment_method,
    setup_future_usage: data.setup_future_usage,
    saved_payment_methods: saved
  });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors() }
  });
}
