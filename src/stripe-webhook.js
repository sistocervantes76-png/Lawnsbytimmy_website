// POST /api/stripe/lbt-webhook
// Verifies Stripe's signature, then records a saved card for lawns_by_timmy only.
// No session cookie and no origin check: the signature is the check.
// Events for any other business (including Fork) are acknowledged and ignored.

import { json } from "./account/lib.js";
import { BUSINESS, cardSaveMode, recordSavedCard } from "./account/card.js";

const MAX_WEBHOOK_BYTES = 256_000;
const TOLERANCE_SECONDS = 5 * 60;
const enc = new TextEncoder();

function parseSignature(header) {
  let timestamp = "";
  const signatures = [];
  for (const part of String(header || "").split(",")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (key === "t") timestamp = value;
    else if (key === "v1") signatures.push(value);
    // v0, secret, destination, and payload are not part of the check.
  }
  return { timestamp, signatures };
}

function hexToBytes(hex) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length !== 64) return null;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function hmacMatches(secret, message, hexSig) {
  const bytes = hexToBytes(hexSig);
  if (!bytes) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, bytes, enc.encode(message));
}

// HMAC of `${timestamp}.${rawBody}`, then a 5-minute window. Constant-time compare via Web Crypto.
export async function verifyStripeSignature(payload, header, secret, nowMs = Date.now()) {
  if (!secret || typeof payload !== "string") return false;
  const { timestamp, signatures } = parseSignature(header);
  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  const message = `${timestamp}.${payload}`;
  let matched = false;
  for (const sig of signatures) {
    if (await hmacMatches(secret, message, sig)) {
      matched = true;
      break;
    }
  }
  if (!matched) return false;
  const age = Math.abs(nowMs / 1000 - Number(timestamp));
  return age <= TOLERANCE_SECONDS;
}

export async function onRequestPost({ request, env }) {
  if (cardSaveMode(env) !== "test") return json({ error: "Not found" }, 404);
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > MAX_WEBHOOK_BYTES) return json({ error: "Payload too large" }, 413);
  const payload = await request.text();
  if (payload.length > MAX_WEBHOOK_BYTES) return json({ error: "Payload too large" }, 413);

  const ok = await verifyStripeSignature(payload, request.headers.get("Stripe-Signature") || "", env.STRIPE_LBT_WEBHOOK_SECRET);
  if (!ok) return json({ error: "Invalid signature" }, 400);

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "Bad payload" }, 400);
  }
  if (event?.livemode === true || event?.type !== "checkout.session.completed") {
    return json({ received: true, ignored: true });
  }
  const checkoutSession = event.data?.object || {};
  if (checkoutSession.mode !== "setup" || checkoutSession.metadata?.business !== BUSINESS) {
    return json({ received: true, ignored: true });
  }
  try {
    const result = await recordSavedCard(env, checkoutSession);
    if (result.ignored) return json({ received: true, ignored: true });
    return json({ received: true });
  } catch (err) {
    console.error("lbt webhook error: " + (err?.message || err));
    return json({ error: "Could not record the card" }, 500);
  }
}
