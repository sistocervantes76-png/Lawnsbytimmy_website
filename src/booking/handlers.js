// HTTP for /api/book/*. Prices and open seats are decided here, not in the browser.
// Routes answer 404 until bookingMode is "test".

import { json, normalizePhone, sameOrigin, sameString } from "../account/lib.js";
import { stripe } from "../account/card.js";
import { MemoryLedger } from "./book.js";
import { confirmPaid, cardFromPaymentIntent } from "./confirm.js";
import {
  ESTIMATE_URL,
  FIRST_CUT_CENTS,
  PACKAGE_CENTS,
  QUOTE_URL,
  VISIT_ZONE1_CENTS,
  VISIT_ZONE2_CENTS,
  bookingConfig,
  isoToMdy,
  newBookingId,
  newCustomerId,
  quotePrice,
  visitLabel,
  zoneForZip,
} from "./config.js";
import { bookingMode } from "./guard.js";
import { parseAvailability } from "./slots.js";

const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

export function getLedger(env) {
  if (env?.SLOT_LEDGER_TEST) return env.SLOT_LEDGER_TEST;
  const namespace = env?.SLOT_LEDGER;
  if (!namespace || typeof namespace.getByName !== "function") return null;
  // One object for the whole crew. A second object would let two people take the last seat.
  return namespace.getByName("lbt-booking");
}

function notFound() {
  return json({ error: "Not found" }, 404);
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

async function readJson(request, limit) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > limit) return { error: json({ error: "Payload too large" }, 413) };
  let text = "";
  try {
    text = await request.text();
  } catch {
    return { error: json({ error: "Send JSON" }, 400) };
  }
  if (text.length > limit) return { error: json({ error: "Payload too large" }, 413) };
  try {
    const value = text ? JSON.parse(text) : {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return { error: json({ error: "Send JSON" }, 400) };
    return { value };
  } catch {
    return { error: json({ error: "Send JSON" }, 400) };
  }
}

function gate(env) {
  if (bookingMode(env) !== "test") return { error: notFound() };
  const ledger = getLedger(env);
  if (!ledger) return { error: notFound() };
  return { ledger };
}

async function refreshSnapshot(env, ledger, { force }) {
  const current = await ledger.readSnapshot();
  const fresh = current?.fetchedAt && Date.now() - current.fetchedAt < SNAPSHOT_TTL_MS;
  if (!force && fresh) return current;
  const res = await fetch(env.BOOKING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "availability_snapshot", key: env.BOOKING_WEBHOOK_KEY }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error("availability refresh failed");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("availability reply was not json");
  }
  const parsed = parseAvailability(data, bookingConfig(env).windows);
  await ledger.putSnapshot(parsed);
  return ledger.readSnapshot();
}

function quoteBody(price) {
  if (!price.payable) {
    return {
      payable: false,
      zone: price.zone,
      reason: price.reason,
      quote_url: QUOTE_URL,
      estimate_url: ESTIMATE_URL,
    };
  }
  return {
    payable: true,
    zone: price.zone,
    plan: price.plan,
    amount_cents: price.amountCents,
    package_cents: PACKAGE_CENTS,
    per_visit_cents: price.zone === 2 ? VISIT_ZONE2_CENTS : VISIT_ZONE1_CENTS,
    price_per_visit: price.pricePerVisit,
    trip_fee: price.zone === 2,
  };
}

export async function onConfig({ env }) {
  if (bookingMode(env) !== "test") return notFound();
  const config = bookingConfig(env);
  return json({
    enabled: true,
    test_mode: true,
    publishableKey: env.STRIPE_LBT_TEST_PUBLISHABLE_KEY,
    windows: config.windows.map((window) => ({ id: window.id, label: window.label })),
    cap_per_window: config.capPerWindow,
    min_lead_days: config.minLeadDays,
    max_lead_days: config.maxLeadDays,
    hold_minutes: config.holdMinutes,
    windows_confirmed: config.windowsConfirmed,
    package_cents: PACKAGE_CENTS,
    first_cut_cents: FIRST_CUT_CENTS,
    visit_cents: VISIT_ZONE1_CENTS,
    zone2_visit_cents: VISIT_ZONE2_CENTS,
    quote_url: QUOTE_URL,
    estimate_url: ESTIMATE_URL,
  });
}

export async function onQuote({ request, env }) {
  if (bookingMode(env) !== "test") return notFound();
  const url = new URL(request.url);
  const zip = String(url.searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
  const yard = url.searchParams.get("yard") === "no" ? "no" : url.searchParams.get("yard") === "yes" ? "yes" : "";
  const plan = url.searchParams.get("plan") === "per_visit" ? "per_visit" : "package";
  if (!/^\d{5}$/.test(zip)) return json({ error: "Please enter a 5-digit ZIP code." }, 400);
  if (!yard) return json({ error: "Please tell us if the grass area is up to 5,000 sq ft." }, 400);
  return json(quoteBody(quotePrice({ zip, plan, yard })));
}

export async function onSlots({ request, env }) {
  const gated = gate(env);
  if (gated.error) return gated.error;
  const zip = String(new URL(request.url).searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return json({ error: "Please enter a 5-digit ZIP code." }, 400);
  if (zoneForZip(zip) === 3) {
    return json({ payable: false, reason: "zone", days: [], quote_url: QUOTE_URL, estimate_url: ESTIMATE_URL });
  }
  try {
    await refreshSnapshot(env, gated.ledger, { force: false });
  } catch (err) {
    console.error("booking slots: " + (err?.message || err));
    return json({ error: "We couldn't check the schedule. Please try again in a minute." }, 503);
  }
  const listed = await gated.ledger.list();
  const config = bookingConfig(env);
  return json({
    payable: true,
    timezone: listed.timezone,
    hold_minutes: config.holdMinutes,
    cap_per_window: config.capPerWindow,
    days: listed.days,
  });
}

function parseHold(body) {
  const first = clean(body.first_name, 40);
  const last = clean(body.last_name, 40);
  const email = clean(body.email, 200);
  const phone = normalizePhone(body.phone);
  const address = clean(body.address || body.service_address, 120);
  const city = clean(body.city, 40);
  const zip = String(body.zip || "").replace(/\D/g, "").slice(0, 5);
  const yard = body.yard === "yes" || body.yard === true ? "yes" : body.yard === "no" || body.yard === false ? "no" : "";
  const plan = body.plan === "package" || body.plan === "per_visit" ? body.plan : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ? body.date : "";
  const windowId = clean(body.window_id, 40);
  const sms = body.sms_consent === true || body.sms_consent === "yes" || body.sms_consent === "on";
  const saveCard = !(body.save_card === false || body.save_card === "no");
  const replaceBookingId = /^BK-[a-f0-9]{16}$/.test(body.replace_booking_id || "") ? body.replace_booking_id : "";
  if (!first || !last) return { error: "Please enter your first and last name." };
  if (!phone) return { error: "Please enter a 10-digit cell number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter your email." };
  if (!address) return { error: "Please enter the service address." };
  if (!city) return { error: "Please enter the city." };
  if (!/^\d{5}$/.test(zip)) return { error: "Please enter a 5-digit ZIP code." };
  if (!yard) return { error: "Please tell us if the grass area is up to 5,000 sq ft." };
  if (!plan) return { error: "Please choose the package or per visit." };
  if (!date || !windowId) return { error: "Please choose a day and arrival window." };
  return {
    value: { first, last, email, phone, address, city, zip, yard, plan, date, windowId, sms, saveCard, replaceBookingId },
  };
}

function description(price) {
  if (price.plan === "package") return "Lawns by Timmy 4-visit bi-weekly package";
  if (price.zone === 2) return "Lawns by Timmy bi-weekly visit, includes trip fee";
  return "Lawns by Timmy bi-weekly visit";
}

function customerForm(customerId, bookingId, fields) {
  const form = new URLSearchParams();
  form.set("name", `${fields.first} ${fields.last}`.trim());
  form.set("email", fields.email);
  form.set("phone", `+1${fields.phone}`);
  form.set("address[line1]", fields.address);
  form.set("address[city]", fields.city);
  form.set("address[postal_code]", fields.zip);
  form.set("address[country]", "US");
  form.set("metadata[business]", "lawns_by_timmy");
  form.set("metadata[crm_customer_id]", customerId);
  form.set("metadata[booking_id]", bookingId);
  form.set("metadata[source]", "website_booking");
  return form;
}

function paymentForm(booking, price, fields) {
  const form = new URLSearchParams();
  form.set("amount", String(price.amountCents));
  form.set("currency", "usd");
  form.set("customer", booking.stripeCustomerId);
  // Stripe API 2026-09-30 refuses payment_method_types on PaymentIntents. Cards (and Link) come from automatic payment methods, with no redirect methods.
  form.set("automatic_payment_methods[enabled]", "true");
  form.set("automatic_payment_methods[allow_redirects]", "never");
  form.set("description", description(price));
  const meta = {
    business: "lawns_by_timmy",
    kind: "booking",
    booking_id: booking.bookingId,
    crm_customer_id: booking.customerId,
    plan: price.plan,
    zone: String(price.zone),
    date: booking.visits[0],
    window: booking.windowLabel,
    window_id: booking.windowId,
    save_card: fields.saveCard ? "yes" : "no",
  };
  for (const [key, value] of Object.entries(meta)) form.set(`metadata[${key}]`, value);
  if (fields.saveCard) form.set("setup_future_usage", "off_session");
  return form;
}

export async function onHold({ request, env }) {
  const gated = gate(env);
  if (gated.error) return gated.error;
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  const body = await readJson(request, 20_000);
  if (body.error) return body.error;
  const parsed = parseHold(body.value);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const fields = parsed.value;
  const price = quotePrice({ zip: fields.zip, plan: fields.plan, yard: fields.yard });
  if (!price.payable) return json(quoteBody(price), 409);
  try {
    await refreshSnapshot(env, gated.ledger, { force: true });
  } catch (err) {
    console.error("booking hold: " + (err?.message || err));
    return json({ error: "We couldn't check the schedule. Please try again in a minute." }, 503);
  }
  const bookingId = newBookingId();
  const customerId = newCustomerId();
  let previousPi = "";
  if (fields.replaceBookingId) {
    const previous = await gated.ledger.read(fields.replaceBookingId);
    if (previous?.status === "held") previousPi = previous.paymentIntentId || "";
  }
  const held = await gated.ledger.hold({
    bookingId,
    customerId,
    date: fields.date,
    windowId: fields.windowId,
    plan: price.plan,
    zone: price.zone,
    amountCents: price.amountCents,
    pricePerVisit: price.pricePerVisit,
    zip: fields.zip,
    yard: fields.yard,
    saveCard: fields.saveCard,
    replaceBookingId: fields.replaceBookingId,
    customer: {
      first_name: fields.first,
      last_name: fields.last,
      email: fields.email,
      phone: fields.phone,
      address: fields.address,
      city: fields.city,
      zip: fields.zip,
      sms_consent: fields.sms,
    },
  });
  if (!held.ok) {
    return json({ error: "That arrival window was just taken. Please pick another.", reason: "taken" }, 409);
  }
  if (previousPi) {
    try {
      await stripe(env, `/payment_intents/${encodeURIComponent(previousPi)}/cancel`, "POST");
    } catch {
      // The old hold is already released. A late payment still has to be reconciled by the webhook.
    }
  }
  try {
    const stripeCustomer = await stripe(env, "/customers", "POST", customerForm(customerId, bookingId, fields), `lbt-book-cust-${customerId}`);
    const booking = { ...held.booking, stripeCustomerId: stripeCustomer.id };
    const paymentIntent = await stripe(env, "/payment_intents", "POST", paymentForm(booking, price, fields), `lbt-book-pi-${bookingId}`);
    await gated.ledger.attachPayment(bookingId, {
      paymentIntentId: paymentIntent.id,
      stripeCustomerId: stripeCustomer.id,
    });
    return json({
      booking_id: bookingId,
      customer_id: customerId,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount_cents: price.amountCents,
      currency: "usd",
      date: held.booking.visits[0],
      label: visitLabel(held.booking.visits[0]),
      window_label: held.booking.windowLabel,
      window_id: held.booking.windowId,
      plan: price.plan,
      visits: held.booking.visits.map((iso, index) => ({ n: index + 1, date: isoToMdy(iso), label: visitLabel(iso) })),
    });
  } catch (err) {
    await gated.ledger.release(bookingId);
    console.error("booking payment: " + (err?.message || err));
    return json({ error: "We couldn't start the payment. Please try again." }, 502);
  }
}

export async function onUpdate({ request, env }) {
  const gated = gate(env);
  if (gated.error) return gated.error;
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  const body = await readJson(request, 8_000);
  if (body.error) return body.error;
  const bookingId = String(body.value.booking_id || "");
  const plan = body.value.plan === "per_visit" ? "per_visit" : body.value.plan === "package" ? "package" : "";
  if (!/^BK-[a-f0-9]{16}$/.test(bookingId) || !plan) return json({ error: "Please choose the package or per visit." }, 400);
  const hold = await gated.ledger.read(bookingId);
  if (!hold || hold.status !== "held") return json({ error: "That hold expired. Please pick another arrival window." }, 409);
  const price = quotePrice({ zip: hold.zip, plan, yard: hold.yard });
  if (!price.payable) return json(quoteBody(price), 409);
  // Omitted save_card keeps the choice stored on the hold. Sending false only turns saving off when it was already off.
  const saveCard = body.value.save_card === undefined
    ? !!hold.saveCard
    : !(body.value.save_card === false || body.value.save_card === "no");
  const form = new URLSearchParams();
  form.set("amount", String(price.amountCents));
  form.set("description", description(price));
  form.set("metadata[plan]", price.plan);
  form.set("metadata[zone]", String(price.zone));
  form.set("metadata[save_card]", saveCard ? "yes" : "no");
  if (saveCard) form.set("setup_future_usage", "off_session");
  try {
    const paymentIntent = await stripe(env, `/payment_intents/${encodeURIComponent(hold.paymentIntentId)}`, "POST", form);
    const updated = await gated.ledger.updatePlan(bookingId, {
      plan: price.plan,
      zone: price.zone,
      amountCents: price.amountCents,
      pricePerVisit: price.pricePerVisit,
      saveCard,
    });
    if (!updated.ok) return json({ error: "That hold expired. Please pick another arrival window." }, 409);
    return json({
      booking_id: bookingId,
      client_secret: paymentIntent.client_secret,
      amount_cents: price.amountCents,
      plan: price.plan,
      save_card: updated.booking.saveCard,
      save_card_locked: !!updated.saveCardLocked,
    });
  } catch (err) {
    console.error("booking update: " + (err?.message || err));
    return json({ error: "We couldn't update the payment. Please try again." }, 502);
  }
}

function statusBody(booking) {
  const first = booking.visits?.[0] || "";
  return {
    status: booking.status,
    date: isoToMdy(first),
    label: visitLabel(first),
    window_label: booking.windowLabel || "",
    amount_cents: booking.amountCents,
    card_brand: booking.cardBrand || "",
    card_last4: booking.cardLast4 || "",
    needs_reschedule: !!booking.needsReschedule,
    customer_id: booking.customerId,
    plan: booking.plan,
    visits: (booking.visits || []).map((iso, index) => ({ n: index + 1, date: isoToMdy(iso), label: visitLabel(iso) })),
  };
}

export async function onStatus({ request, env }) {
  const gated = gate(env);
  if (gated.error) return gated.error;
  const url = new URL(request.url);
  const bookingId = String(url.searchParams.get("booking_id") || "");
  const paymentIntentId = String(url.searchParams.get("payment_intent") || "");
  let booking = null;
  if (/^BK-[a-f0-9]{16}$/.test(bookingId)) booking = await gated.ledger.read(bookingId);
  else if (/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) booking = await gated.ledger.readByPaymentIntent(paymentIntentId);
  if (!booking) return json({ error: "We couldn't find that booking." }, 404);
  if (!booking.forwarded && booking.paymentIntentId && booking.status !== "released") {
    let remote = null;
    try {
      remote = await stripe(env, `/payment_intents/${encodeURIComponent(booking.paymentIntentId)}?expand[]=latest_charge`);
    } catch (err) {
      console.error("booking status: " + (err?.message || err));
    }
    if (remote?.status === "succeeded") {
      try {
        await confirmPaid(env, gated.ledger, {
          bookingId: booking.bookingId,
          card: { ...cardFromPaymentIntent(remote), saved: booking.saveCard },
          eventId: `status:${remote.id}`,
        });
      } catch (err) {
        console.error("booking status forward: " + (err?.message || err));
        return json({ error: "Payment received. We're still saving the booking. Please wait a moment and refresh." }, 503);
      }
      booking = await gated.ledger.read(booking.bookingId);
    } else if (remote?.status === "canceled" && booking.status === "held") {
      await gated.ledger.release(booking.bookingId);
      booking = await gated.ledger.read(booking.bookingId);
    }
  }
  // The seat is already free once the hold time passes. Say so before Stripe cancels the PaymentIntent.
  if (booking.status === "held" && booking.expiresAt <= Date.now()) {
    booking = { ...booking, status: "expired" };
  }
  return json(statusBody(booking));
}

export async function onSnapshot({ request, env }) {
  const gated = gate(env);
  if (gated.error) return gated.error;
  const body = await readJson(request, 200_000);
  if (body.error) return body.error;
  const provided = request.headers.get("X-Lbt-Snapshot-Key") || body.value.key || "";
  if (!sameString(String(provided), String(env.BOOKING_WEBHOOK_KEY || ""))) return notFound();
  try {
    const parsed = parseAvailability(body.value, bookingConfig(env).windows);
    await gated.ledger.putSnapshot(parsed);
    return json({ ok: true, jobs: parsed.jobs.length, blocks: parsed.blocks.length });
  } catch (err) {
    console.error("booking snapshot: " + (err?.message || err));
    return json({ error: "Send the Jobs sheet." }, 400);
  }
}

export const config = { onRequestGet: onConfig };
export const quote = { onRequestGet: onQuote };
export const slots = { onRequestGet: onSlots };
export const hold = { onRequestPost: onHold };
export const update = { onRequestPost: onUpdate };
export const status = { onRequestGet: onStatus };
export const snapshot = { onRequestPost: onSnapshot };

// Kept so a test can build a ledger without importing the Durable Object runtime.
export { MemoryLedger };
