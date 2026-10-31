// Shared helpers for the customer account area (/account).
// This file is imported by the API routes; it is not a route itself.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const SESSION_COOKIE = "lbt_session";
export const CODE_COOKIE = "lbt_code";
export const CODE_MINUTES = 10;
export const SESSION_DAYS = 30;
export const PHONE = "(954) 880-3500";

// ---------- rate limiting + one-time codes ----------
// Both are switched on by bindings in wrangler.jsonc. If a binding is missing
// the site still works, just without that protection.

// The visitor's IP address, as reported by Cloudflare.
export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

// True when `key` has gone over the limit set on this rate-limit binding.
// Never blocks a real customer because of a Cloudflare hiccup: errors count as "not limited".
export async function overLimit(limiter, key) {
  if (!limiter) return false;
  try {
    const { success } = await limiter.limit({ key });
    return !success;
  } catch (err) {
    console.error("rate limiter error", err);
    return false;
  }
}

// The KV store that remembers which codes were already used (and which phones
// were just texted). Null when not set up yet.
export function linkStore(env) {
  return env.LOGIN_LINKS || null;
}

// ---------- Cloudflare settings (Variables and Secrets) ----------
// These three must exist on the lawnsbytimmy-website Worker, under
// Settings -> Variables and Secrets (NOT under Settings -> Build, which the
// running code can't see). Names are case-sensitive.
export const REQUIRED_SETTINGS = ["SESSION_SECRET", "ACCOUNT_WEBHOOK_URL", "ACCOUNT_WEBHOOK_KEY"];

// Reads a setting, forgiving stray spaces/newlines or quotes pasted around the value.
export function setting(env, name) {
  const raw = env && env[name];
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/^(["'])(.*)\1$/s, "$2").trim();
}

// Plain-words status of each required setting: "ok", "missing", or what's wrong with it.
export function settingsStatus(env) {
  const status = {};
  for (const name of REQUIRED_SETTINGS) status[name] = setting(env, name) ? "ok" : "missing";
  if (status.SESSION_SECRET === "ok" && setting(env, "SESSION_SECRET").length < 32) {
    status.SESSION_SECRET = "too short (needs 32+ characters)";
  }
  const url = setting(env, "ACCOUNT_WEBHOOK_URL");
  if (url && !/^https:\/\/hook\.[a-z0-9.]*make\.com\//i.test(url)) {
    status.ACCOUNT_WEBHOOK_URL = "set, but doesn't look like a Make webhook address (https://hook...make.com/...)";
  }
  return status;
}

// Logs a clear error and returns a 503 response when a required setting is
// missing or wrong; returns null when everything is in place.
export function settingsProblem(env, where) {
  const status = settingsStatus(env);
  const bad = Object.entries(status).filter(([, v]) => v !== "ok");
  if (!bad.length) return null;
  console.error(
    `[account] ${where} stopped before calling Make: Cloudflare setting(s) not usable -> ` +
      bad.map(([k, v]) => `${k}: ${v}`).join("; ") +
      ". Add them on the lawnsbytimmy-website Worker under Settings > Variables and Secrets, then redeploy."
  );
  return json({ error: `Account sign-in isn't available right now. Please call ${PHONE}.` }, 503);
}

// ---------- small utils ----------

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

// "(954) 557-3800", "954.557.3800", "+1 954 557 3800" -> "9545573800". Null if not a US number.
export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^[2-9]\d{9}$/.test(ten) ? ten : null;
}

function b64urlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ---------- signed tokens (code challenge + session cookie) ----------
// A token is base64url(payload).base64url(HMAC-SHA256(payload)). It can't be
// forged without SESSION_SECRET, so no database is needed.

async function hmacKey(secret) {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters");
  }
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function hmac(secret, text) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(text));
  return b64urlEncode(new Uint8Array(sig));
}

export async function signToken(payload, secret) {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifyToken(token, secret, purpose) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), b64urlDecode(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlDecode(body)));
    if (payload.p !== purpose) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Compares two strings without leaking where they differ.
export function sameString(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export function cookie(name, token, maxAgeSeconds, path = "/") {
  return `${name}=${token}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function sessionCookie(token, maxAgeSeconds) {
  return cookie(SESSION_COOKIE, token, maxAgeSeconds);
}

// Sessions from the old Stripe email sign-in carry a Stripe id; they no longer count.
export async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  const session = token ? await verifyToken(token, setting(env, "SESSION_SECRET"), "session") : null;
  return session && /^LC-/.test(session.cid || "") ? session : null;
}

// Blocks cross-site form posts: state-changing requests must come from our own pages.
export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // same-origin fetches from older browsers may omit it; SameSite=Lax still protects the cookie
  return origin === new URL(request.url).origin;
}

// ---------- Make.com bridge ----------
// One webhook handles every account event; the "event" field tells the
// scenario's router which path to take. Every call carries ACCOUNT_WEBHOOK_KEY,
// and the scenario ignores calls without it.

export async function sendToMake(env, event, data, { expectResponse = false } = {}) {
  const url = setting(env, "ACCOUNT_WEBHOOK_URL");
  const key = setting(env, "ACCOUNT_WEBHOOK_KEY");
  const missing = [!url && "ACCOUNT_WEBHOOK_URL", !key && "ACCOUNT_WEBHOOK_KEY"].filter(Boolean);
  if (missing.length) {
    throw new Error(`Not calling Make (${event}): Cloudflare setting(s) missing: ${missing.join(", ")}`);
  }
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, key, timestamp: new Date().toISOString(), ...data }),
    });
  } catch (err) {
    throw new Error(`Couldn't reach the Make webhook (${event}): ${err.message}`);
  }
  if (!res.ok) throw new Error(`Make webhook returned ${res.status} for ${event}`);
  if (!expectResponse) return true;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Make webhook answered without JSON (wrong key, or the scenario is off)");
  }
}

// ---------- CRM (Google Sheet, read through Make) ----------

const CRM_RANGES = ["Customers", "Invoices", "Jobs"];

// Turns a sheet's rows into objects keyed by its header row.
function rowsToObjects(values) {
  const [header = [], ...rows] = values || [];
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [String(h).trim(), r[i] ?? ""])));
}

// One read of the Customers, Invoices and Jobs tabs.
export async function readCrm(env) {
  const data = await sendToMake(env, "crm_snapshot", {}, { expectResponse: true });
  const ranges = data?.valueRanges;
  if (!Array.isArray(ranges) || ranges.length !== CRM_RANGES.length) throw new Error("CRM snapshot came back empty");
  const out = {};
  CRM_RANGES.forEach((name, i) => {
    out[name.toLowerCase()] = rowsToObjects(ranges[i].values);
  });
  return out;
}

// Real customers only (IDs like LC-0001), not missed-call leads or test rows.
export function findCustomers(crm, test) {
  return crm.customers.filter((c) => /^LC-\d+$/.test(c.Customer_ID) && test(c));
}
