// Booking stays off until the Worker role, the mode flag, and the matching
// Stripe keys are all set. The test Worker accepts test keys only. The
// production Worker accepts live keys only, and only when BOOKING_MODE=live.

import { STRIPE_API_VERSION, isTestKey } from "../account/card.js";

export function liveKeyRefused(key) {
  return /^(?:sk|rk|pk)_live_/.test(String(key || ""));
}

export function isLiveSecret(key) {
  return typeof key === "string" && /^(?:sk|rk)_live_[A-Za-z0-9_]+$/.test(key);
}

export function isLivePublishable(key) {
  return typeof key === "string" && /^pk_live_[A-Za-z0-9_]+$/.test(key);
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

function workerRole(env) {
  const role = String(env?.BOOKING_WORKER || "").trim();
  return role === "production" || role === "test" ? role : "";
}

export function bookingMode(env) {
  if (!env) return "off";
  if (!env.SLOT_LEDGER && !env.SLOT_LEDGER_TEST) return "off";
  if (!isAllowedHookUrl(env.BOOKING_WEBHOOK_URL)) return "off";
  if (!String(env.BOOKING_WEBHOOK_KEY || "").trim()) return "off";
  const mode = String(env.BOOKING_MODE || "").trim();
  const role = workerRole(env);
  if (mode === "test") {
    // Test keys are refused on the production Worker.
    if (role !== "test") return "off";
    const secret = env.STRIPE_LBT_TEST_SECRET_KEY;
    if (liveKeyRefused(secret) || !isTestKey(secret)) return "off";
    const publishable = String(env.STRIPE_LBT_TEST_PUBLISHABLE_KEY || "");
    if (liveKeyRefused(publishable) || !/^pk_test_[A-Za-z0-9_]+$/.test(publishable)) return "off";
    if (!String(env.STRIPE_BOOKING_WEBHOOK_SECRET || "").trim()) return "off";
    return "test";
  }
  if (mode === "live") {
    // Live keys are refused on the test Worker.
    if (role !== "production") return "off";
    if (!isLiveSecret(env.STRIPE_LBT_LIVE_SECRET_KEY)) return "off";
    if (!isLivePublishable(env.STRIPE_LBT_LIVE_PUBLISHABLE_KEY)) return "off";
    if (!String(env.STRIPE_LBT_LIVE_WEBHOOK_SECRET || "").trim()) return "off";
    return "live";
  }
  return "off";
}

export function publishableKeyFor(env) {
  const mode = bookingMode(env);
  if (mode === "live") return env.STRIPE_LBT_LIVE_PUBLISHABLE_KEY;
  if (mode === "test") return env.STRIPE_LBT_TEST_PUBLISHABLE_KEY;
  return "";
}

export function webhookSecretFor(env) {
  const mode = bookingMode(env);
  if (mode === "live") return env.STRIPE_LBT_LIVE_WEBHOOK_SECRET;
  if (mode === "test") return env.STRIPE_BOOKING_WEBHOOK_SECRET;
  return "";
}

// Live bookings offer the package only until per-visit is turned on.
// The test Worker keeps both plans unless BOOKING_PLANS says otherwise.
export function bookingPlans(env) {
  const raw = String(env?.BOOKING_PLANS ?? "").trim();
  if (raw) {
    const plans = [...new Set(raw.split(/[\s,]+/).filter((plan) => plan === "package" || plan === "per_visit"))];
    if (plans.length) return plans;
  }
  return bookingMode(env) === "live" ? ["package"] : ["package", "per_visit"];
}

export function planAllowed(env, plan) {
  return bookingPlans(env).includes(plan);
}

export async function bookingStripe(env, path, method = "GET", form = null, idemKey = null) {
  const mode = bookingMode(env);
  const key = mode === "live" ? env.STRIPE_LBT_LIVE_SECRET_KEY : env.STRIPE_LBT_TEST_SECRET_KEY;
  if (mode === "test" && !isTestKey(key)) {
    const err = new Error("Stripe test key required");
    err.code = "test_key_required";
    throw err;
  }
  if (mode === "live" && !isLiveSecret(key)) {
    const err = new Error("Stripe live key required");
    err.code = "live_key_required";
    throw err;
  }
  if (mode !== "test" && mode !== "live") {
    const err = new Error("Booking is off");
    err.code = "booking_off";
    throw err;
  }
  if (typeof path !== "string" || !path.startsWith("/") || path.includes("://")) {
    throw new Error("Bad Stripe path");
  }
  const headers = {
    Authorization: `Bearer ${key}`,
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (idemKey) headers["Idempotency-Key"] = idemKey;
  let body;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = form instanceof URLSearchParams ? form.toString() : String(form);
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Stripe error ${res.status}`);
    err.status = res.status;
    err.code = data?.error?.code || "";
    throw err;
  }
  return data;
}
