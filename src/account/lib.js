// Shared helpers for the customer account area (/account).
// This file is imported by the API routes; it is not a route itself.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const SESSION_COOKIE = "lbt_session";
export const LOGIN_LINK_MINUTES = 15;
export const SESSION_DAYS = 30;
export const PHONE = "(954) 880-3500";

// ---------- rate limiting + one-time links ----------
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

// The KV store that remembers which sign-in links were already used
// (and which emails were just sent a link). Null when not set up yet.
export function linkStore(env) {
  return env.LOGIN_LINKS || null;
}

// ---------- small utils ----------

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
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

// ---------- signed tokens (login links + session cookie) ----------
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

export async function signToken(payload, secret) {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
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

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export function sessionCookie(token, maxAgeSeconds) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  return token ? verifyToken(token, env.SESSION_SECRET, "session") : null;
}

// Blocks cross-site form posts: state-changing requests must come from our own pages.
export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // same-origin fetches from older browsers may omit it; SameSite=Lax still protects the cookie
  return origin === new URL(request.url).origin;
}

// ---------- Stripe ----------

function stripeBase(env) {
  return env.STRIPE_API_BASE || "https://api.stripe.com";
}

export async function stripe(env, method, path, params) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  let url = `${stripeBase(env)}${path}`;
  const init = {
    method,
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  };
  if (params) {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) v.forEach((item) => body.append(`${k}[]`, item));
      else if (v !== undefined && v !== null) body.append(k, String(v));
    }
    if (method === "GET") url += `?${body}`;
    else {
      init.body = body;
      init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
  }
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path} failed: ${data?.error?.message || res.status}`);
  return data;
}

// Finds the Stripe customer for an email. Stripe's email filter is case-sensitive,
// so we also try the address exactly as stored on older records.
export async function findStripeCustomer(env, email) {
  const list = await stripe(env, "GET", "/v1/customers", { email, limit: 10 });
  let customers = list.data || [];
  if (!customers.length) {
    const search = await stripe(env, "GET", "/v1/customers/search", { query: `email:'${email.replace(/'/g, "")}'` });
    customers = (search.data || []).filter((c) => (c.email || "").toLowerCase() === email);
  }
  customers = customers.filter((c) => !c.deleted);
  if (!customers.length) return null;
  // Prefer the record that actually has a card saved.
  return customers.find((c) => c.invoice_settings?.default_payment_method) || customers[0];
}

// ---------- Make.com bridge ----------
// One webhook handles every account event; the "event" field tells the
// scenario's router which path to take.

export async function sendToMake(env, event, data, { expectResponse = false } = {}) {
  if (!env.ACCOUNT_WEBHOOK_URL) return null;
  const res = await fetch(env.ACCOUNT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
  });
  if (!res.ok) throw new Error(`Make webhook returned ${res.status}`);
  if (!expectResponse) return true;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null; // scenario answered "Accepted" instead of JSON — treat as no CRM data
  }
}
