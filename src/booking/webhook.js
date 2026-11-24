// POST /api/stripe/booking-webhook
// Verifies Stripe's signature, then confirms or releases the held seat.
// payment_intent.succeeded forwards one booking_paid call. A reply that is not
// JSON with ok:true comes back as 500 so Stripe retries. Retries are safe:
// the ledger remembers the event id, and the test scenario remembers the PaymentIntent.

import { json } from "../account/lib.js";
import { verifyStripeSignature } from "../stripe-webhook.js";
import { confirmPaid } from "./confirm.js";
import { bookingMode, webhookSecretFor } from "./guard.js";
import { getLedger } from "./handlers.js";

const MAX_WEBHOOK_BYTES = 256_000;
const BUSINESS = "lawns_by_timmy";

function cardFromSetup(setupIntent) {
  const card = setupIntent?.payment_method?.card || null;
  return {
    last4: /^\d{4}$/.test(card?.last4 || "") ? card.last4 : "",
    brand: String(card?.brand || "").toLowerCase(),
  };
}

export function classifyStripeEvent(event, mode = "test") {
  if (!event || typeof event !== "object") return { action: "ignore", reason: "event" };
  const object = event.data?.object || {};
  const flags = [event.livemode, object.livemode].filter((value) => typeof value === "boolean");
  const live = flags.length > 0 && flags.every(Boolean);
  const test = flags.length > 0 && flags.every((value) => value === false);
  // Live events are accepted only in live mode. Test events are accepted only in test mode.
  if (mode === "live" ? !live : !test) return { action: "ignore", reason: "livemode" };
  const meta = object.metadata || {};
  if (meta.business !== BUSINESS) return { action: "ignore", reason: "business" };
  const bookingId = String(meta.booking_id || "");
  const type = event.type;
  if (type === "payment_intent.succeeded") {
    if (meta.kind && meta.kind !== "booking") return { action: "ignore", reason: "kind" };
    if (!bookingId) return { action: "ignore", reason: "booking" };
    const card = object.charges?.data?.[0]?.payment_method_details?.card
      || object.latest_charge?.payment_method_details?.card
      || null;
    return {
      action: "confirm",
      bookingId,
      card: {
        last4: /^\d{4}$/.test(card?.last4 || "") ? card.last4 : "",
        brand: String(card?.brand || "").toLowerCase(),
      },
    };
  }
  if (type === "payment_intent.payment_failed" || type === "payment_intent.canceled") {
    if (meta.kind && meta.kind !== "booking") return { action: "ignore", reason: "kind" };
    if (!bookingId) return { action: "ignore", reason: "booking" };
    return { action: "release", bookingId };
  }
  if (type === "setup_intent.succeeded") {
    if (meta.kind && meta.kind !== "booking" && meta.kind !== "booking_card") return { action: "ignore", reason: "kind" };
    if (!bookingId) return { action: "ignore", reason: "booking" };
    return { action: "setup", bookingId, card: cardFromSetup(object) };
  }
  return { action: "ignore", reason: "type" };
}

export async function onRequestPost({ request, env }) {
  const mode = bookingMode(env);
  if (mode === "off") return json({ error: "Not found" }, 404);
  const ledger = getLedger(env);
  if (!ledger) return json({ error: "Not found" }, 404);
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > MAX_WEBHOOK_BYTES) return json({ error: "Payload too large" }, 413);
  const payload = await request.text();
  if (payload.length > MAX_WEBHOOK_BYTES) return json({ error: "Payload too large" }, 413);
  const ok = await verifyStripeSignature(
    payload,
    request.headers.get("Stripe-Signature") || "",
    webhookSecretFor(env),
  );
  if (!ok) return json({ error: "Invalid signature" }, 400);
  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "Bad payload" }, 400);
  }
  if (!event?.id || typeof event.id !== "string") return json({ error: "Bad payload" }, 400);
  const decision = classifyStripeEvent(event, mode);
  if (decision.action === "ignore") {
    await ledger.finishIgnored(event.id);
    return json({ received: true, ignored: true });
  }
  if (decision.action === "release") {
    await ledger.releaseFromEvent({ bookingId: decision.bookingId, eventId: event.id });
    return json({ received: true });
  }
  if (decision.action === "setup") {
    await ledger.attachCard({ bookingId: decision.bookingId, card: decision.card, eventId: event.id });
    return json({ received: true });
  }
  try {
    const result = await confirmPaid(env, ledger, {
      bookingId: decision.bookingId,
      card: decision.card,
      eventId: event.id,
    });
    if (result.missing) {
      console.error("booking webhook missing hold");
      return json({ received: true, ignored: true });
    }
    return json({ received: true, duplicate: !!result.duplicate });
  } catch (err) {
    console.error("booking webhook: " + (err?.message || err));
    return json({ error: "Could not record the booking" }, 500);
  }
}
