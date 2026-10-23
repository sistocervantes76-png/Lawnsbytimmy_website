// GET /api/account/health
// A setup check for Timmy: open lawnsbytimmy.com/api/account/health in a browser
// to see whether each sign-in setting in Cloudflare is working. It never shows
// the secrets themselves or any customer data, only "ok" or what's wrong.
import { json, stripe } from "./lib.js";

// Stripe error messages can echo part of the key; never send that back.
function clean(message) {
  return String(message || "").replace(/\b(sk|rk|pk)_(live|test)_[A-Za-z0-9*]+/g, "[key hidden]");
}

function keyKind(key) {
  const m = /^(sk|rk|pk)_(live|test)_/.exec(key || "");
  if (!m) return "not a Stripe secret key";
  const kind = { sk: "secret key", rk: "restricted key", pk: "publishable key (wrong one)" }[m[1]];
  return `${kind}, ${m[2]} mode`;
}

async function checkStripe(env) {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, problem: "STRIPE_SECRET_KEY is not set in Cloudflare." };
  const key = env.STRIPE_SECRET_KEY;
  const result = { key_type: keyKind(key) };
  if (key !== key.trim()) result.problem = "The key has extra spaces or a line break around it. Paste it again.";
  try {
    const list = await stripe(env, "GET", "/v1/customers", { limit: 1 });
    result.customers_in_stripe = (list.data || []).length > 0 ? "yes" : "none yet";
    await stripe(env, "GET", "/v1/customers/search", { query: "email:'health-check@example.com'" });
    result.ok = !result.problem;
  } catch (err) {
    result.ok = false;
    result.problem = clean(err.message);
  }
  return result;
}

function checkSessionSecret(env) {
  const s = env.SESSION_SECRET;
  if (!s) return { ok: false, problem: "SESSION_SECRET is not set in Cloudflare." };
  if (s.length < 32) return { ok: false, problem: `SESSION_SECRET is only ${s.length} characters. It needs at least 32.` };
  return { ok: true };
}

function checkWebhook(env) {
  const raw = env.ACCOUNT_WEBHOOK_URL;
  if (!raw) return { ok: false, problem: "ACCOUNT_WEBHOOK_URL is not set in Cloudflare, so no sign-in emails go out." };
  if (raw !== raw.trim()) return { ok: false, problem: "ACCOUNT_WEBHOOK_URL has extra spaces or a line break. Paste it again." };
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith("make.com")) {
      return { ok: false, problem: `ACCOUNT_WEBHOOK_URL points to ${url.hostname}, not Make.` };
    }
    return { ok: true, ends_with: raw.slice(-6) };
  } catch {
    return { ok: false, problem: "ACCOUNT_WEBHOOK_URL is not a valid web address." };
  }
}

export async function onRequestGet({ env }) {
  const checks = {
    stripe: await checkStripe(env),
    session_secret: checkSessionSecret(env),
    make_webhook: checkWebhook(env),
  };
  const allOk = Object.values(checks).every((c) => c.ok);
  return json({ all_ok: allOk, checks });
}
