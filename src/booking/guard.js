// The booking feature stays off unless every test switch is set.
// A live Stripe key is refused the same way card saving refuses one.

import { isTestKey } from "../account/card.js";

export function liveKeyRefused(key) {
  return /^(?:sk|rk|pk)_live_/.test(String(key || ""));
}

export function isAllowedHookUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.username || url.password) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost")) return true;
    return false;
  } catch {
    return false;
  }
}

export function bookingMode(env) {
  if (!env || String(env.BOOKING_MODE || "").trim() !== "test") return "off";
  const secret = env.STRIPE_LBT_TEST_SECRET_KEY;
  if (liveKeyRefused(secret) || !isTestKey(secret)) return "off";
  const publishable = String(env.STRIPE_LBT_TEST_PUBLISHABLE_KEY || "");
  if (liveKeyRefused(publishable) || !/^pk_test_[A-Za-z0-9_]+$/.test(publishable)) return "off";
  if (!String(env.STRIPE_BOOKING_WEBHOOK_SECRET || "").trim()) return "off";
  if (!isAllowedHookUrl(env.BOOKING_WEBHOOK_URL)) return "off";
  if (!String(env.BOOKING_WEBHOOK_KEY || "").trim()) return "off";
  // No ledger binding (the production Worker) stays off even if the secrets are copied over.
  if (!env.SLOT_LEDGER && !env.SLOT_LEDGER_TEST) return "off";
  return "test";
}
