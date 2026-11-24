// Turns a paid PaymentIntent into one booking_paid call.
// Anything other than a JSON reply with ok:true is a failure so Stripe retries.
// The shared key is the JSON "key" field the test scenario filters on.

import { bookingMode, bookingStripe, isAllowedHookUrl } from "./guard.js";

export function cardFromPaymentIntent(paymentIntent) {
  const card = paymentIntent?.latest_charge?.payment_method_details?.card
    || paymentIntent?.charges?.data?.[0]?.payment_method_details?.card
    || (paymentIntent?.payment_method && typeof paymentIntent.payment_method === "object"
      ? paymentIntent.payment_method.card
      : null)
    || null;
  return {
    last4: /^\d{4}$/.test(card?.last4 || "") ? card.last4 : "",
    brand: String(card?.brand || "").toLowerCase(),
  };
}

export async function forwardBookingPaid(env, payload) {
  const url = String(env.BOOKING_WEBHOOK_URL || "");
  const key = String(env.BOOKING_WEBHOOK_KEY || "");
  if (!isAllowedHookUrl(url) || !key) throw new Error("booking webhook is not set");
  if (!/^LC-\d+$/.test(payload?.customer_id || "")) throw new Error("customer id");
  if (!/^pi_[A-Za-z0-9_]+$/.test(payload?.payment_intent_id || "")) throw new Error("payment intent");
  if (!Array.isArray(payload.visits) || payload.visits.length !== 4) throw new Error("visits");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, test: bookingMode(env) !== "live", key }),
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  // "Accepted", a non-JSON body, ok:false, or a non-2xx status all retry.
  if (!res.ok || !data || data.ok !== true) throw new Error("booking webhook did not confirm");
  return data;
}

async function cardFor(env, booking, card) {
  if (card?.last4) return { ...card, saved: booking.saveCard };
  if (!booking.paymentIntentId) return { brand: card?.brand || "", last4: "", saved: booking.saveCard };
  const remote = await bookingStripe(
    env,
    `/payment_intents/${encodeURIComponent(booking.paymentIntentId)}?expand[]=latest_charge`,
  );
  const found = cardFromPaymentIntent(remote);
  return { brand: found.brand || card?.brand || "", last4: found.last4 || "", saved: booking.saveCard };
}

export async function confirmPaid(env, ledger, { bookingId, card, eventId }) {
  const current = await ledger.read(bookingId);
  if (!current) return { missing: true };
  const details = await cardFor(env, current, card || {});
  const prepared = await ledger.prepareConfirm({ bookingId, card: details, eventId });
  if (prepared.duplicate || prepared.missing || prepared.send === false) return prepared;
  if (prepared.inProgress) {
    const err = new Error("forward in progress");
    err.code = "in_progress";
    throw err;
  }
  try {
    await forwardBookingPaid(env, prepared.payload);
  } catch (err) {
    await ledger.abortForward({ bookingId });
    throw err;
  }
  await ledger.markForwarded({ bookingId, eventId });
  return { ok: true, booking: prepared.booking };
}
