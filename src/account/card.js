// Save, replace, or remove a card on the account page. Stripe test mode only.
// The routes answer 404 unless CARD_SAVE_MODE=test and both test secrets are set,
// so a merge does not show the button or call Stripe for live customers.
// This file never reads the old Stripe secret. Card saving uses the test key only.

import {
  json,
  getSession,
  sameOrigin,
  overLimit,
  clientIp,
  readCrm,
  findCustomers,
  normalizePhone,
  sendToMake,
  PHONE,
} from "./lib.js";

export const BUSINESS = "lawns_by_timmy";
export const STRIPE_API_VERSION = "2026-09-30.endive";
export const CONSENT_VERSION_DATE = "20261112";
export const SETUP_DESCRIPTION = "Lawns by Timmy card on file (charged after each completed visit)";
const SUCCESS_URL = "https://lawnsbytimmy.com/account/?card=saved&cs={CHECKOUT_SESSION_ID}";
const CANCEL_URL = "https://lawnsbytimmy.com/account/?card=cancelled";
const SESSION_SECONDS = 60 * 60;

// Exact consent template. The version tag is a hash of this string, so any
// wording change produces a new tag. Bump CONSENT_VERSION_DATE when it changes.
// ${Price_Per_Visit} is filled from the CRM. If the price is blank, that
// parenthetical is omitted and the hash stays on this template.
export const CONSENT_TEMPLATE =
  "By saving your card, you authorize Lawns by Timmy to charge it after each completed visit for your visit price (currently ${Price_Per_Visit}), or once a month if you're on a monthly plan. Nothing is charged today. You'll get a receipt each time. You can remove your card anytime on your account page or by texting (954) 880-3500.";

const enc = new TextEncoder();

export function isTestKey(key) {
  return typeof key === "string"
    && /^(?:sk|rk)_test_[A-Za-z0-9_]+$/.test(key)
    && !/^(?:sk|rk)_live_/.test(key);
}

// "test" only when the flag and both new secrets are present and the key is a test key.
// A live key, or any other flag value, stays off.
export function cardSaveMode(env) {
  if (!env || String(env.CARD_SAVE_MODE || "").trim() !== "test") return "off";
  if (!isTestKey(env.STRIPE_LBT_TEST_SECRET_KEY)) return "off";
  if (!String(env.STRIPE_LBT_WEBHOOK_SECRET || "").trim()) return "off";
  return "test";
}

// Trade customers are never offered a card. "Contains trade" is case-insensitive,
// so "Trade (storage space)" is included. When CARD_SAVE_MODE is test, only a
// CRM row whose Status contains "Test" (any capitalization) may save a card.
export function customerMaySaveCard(row) {
  if (!row || !/^LC-\d+$/.test(row.Customer_ID || "")) return false;
  if (/trade/i.test(row.Payment_Method || "")) return false;
  if (!/test/i.test(String(row.Status || ""))) return false;
  return true;
}

export function cardSummary(raw) {
  const text = String(raw || "").trim();
  if (!text || /^no$/i.test(text)) return { saved: false, label: "" };
  const body = text.replace(/^Yes:\s*/i, "").trim();
  const match = body.match(/^([A-Za-z]+)\s+(\d{4})\b/);
  if (match) return { saved: true, label: `${match[1]} •••• ${match[2]}` };
  return { saved: true, label: body || "Card saved" };
}

export function consentMessage(pricePerVisit) {
  const raw = String(pricePerVisit ?? "").trim();
  const amount = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!raw || !Number.isFinite(amount) || amount <= 0) {
    return CONSENT_TEMPLATE.replace(" (currently ${Price_Per_Visit})", "");
  }
  const shown = Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
  return CONSENT_TEMPLATE.replace("${Price_Per_Visit}", shown);
}

export async function consentVersion() {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(CONSENT_TEMPLATE));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 8);
  return `lbt-card-consent-${CONSENT_VERSION_DATE}-${hex}`;
}

function serverError(err, label) {
  console.error(`${label}: ${err?.message || err}`);
  return json({ error: `We couldn't update your card right now. Please try again, or call ${PHONE}.` }, 500);
}

function notFound() {
  return json({ error: "Not found" }, 404);
}

function stripeId(value, prefix) {
  const id = typeof value === "string" ? value : value?.id;
  if (typeof id !== "string" || !id.startsWith(prefix) || !/^[A-Za-z0-9_]+$/.test(id)) return null;
  return id;
}

function isOurCustomer(row, customerId) {
  return !!row
    && row.deleted !== true
    && row.metadata?.business === BUSINESS
    && row.metadata?.crm_customer_id === customerId
    && !!stripeId(row.id, "cus_");
}

function crmEmail(value) {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function encodeForm(form) {
  const params = form instanceof URLSearchParams ? [...form.entries()] : Object.entries(form);
  return params
    .map(([key, value]) => {
      const encoded = encodeURIComponent(String(value)).replace(/%7B/g, "{").replace(/%7D/g, "}");
      return `${encodeURIComponent(key)}=${encoded}`;
    })
    .join("&");
}

function integrationIdentifier() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let suffix = "";
  for (const b of bytes) suffix += alphabet[b % 26];
  return `lbtcard${suffix}`;
}

// Refuses anything that is not an rk_test_ or sk_test_ key before the request is sent.
export async function stripe(env, path, method = "GET", form = null, idemKey = null) {
  if (!isTestKey(env?.STRIPE_LBT_TEST_SECRET_KEY)) {
    const err = new Error("Stripe test key required");
    err.code = "test_key_required";
    throw err;
  }
  if (typeof path !== "string" || !path.startsWith("/") || path.includes("://")) {
    throw new Error("Bad Stripe path");
  }
  const headers = {
    Authorization: `Bearer ${env.STRIPE_LBT_TEST_SECRET_KEY}`,
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (idemKey) headers["Idempotency-Key"] = idemKey;
  let body;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = encodeForm(form);
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

async function retrieveCustomer(env, id) {
  try {
    return await stripe(env, `/customers/${id}`);
  } catch (err) {
    if (err.status === 404 || err.code === "resource_missing") return null;
    throw err;
  }
}

// CRM Stripe_Customer_ID, then a metadata search, and only then create.
// A customer tagged for another business is never reused.
async function findOrCreateCustomer(env, customer, session, { create = true } = {}) {
  const cid = customer.Customer_ID;
  if (!/^LC-\d+$/.test(cid || "")) throw new Error("bad customer id");

  const stored = stripeId(String(customer.Stripe_Customer_ID || "").trim(), "cus_");
  if (stored) {
    const found = await retrieveCustomer(env, stored);
    if (isOurCustomer(found, cid)) return found;
  }

  const query = `metadata['business']:'${BUSINESS}' AND metadata['crm_customer_id']:'${cid}'`;
  const search = await stripe(env, `/customers/search?query=${encodeURIComponent(query)}`);
  const match = (search.data || []).find((row) => isOurCustomer(row, cid));
  if (match) return match;
  if (!create) return null;

  const form = new URLSearchParams();
  const name = [customer.First_Name, customer.Last_Name].filter(Boolean).join(" ").trim();
  if (name) form.set("name", name);
  const phone = normalizePhone(session.phone);
  if (phone) form.set("phone", `+1${phone}`);
  // Email only when the CRM already has one. An address typed into Checkout is not copied here.
  const email = crmEmail(customer.Email);
  if (email) form.set("email", email);
  form.set("metadata[business]", BUSINESS);
  form.set("metadata[crm_customer_id]", cid);
  form.set("metadata[source]", "account_page");
  return stripe(env, "/customers", "POST", form, `lbt-cust-${cid}`);
}

async function listCards(env, customerId) {
  const cards = [];
  let startingAfter = "";
  for (let page = 0; page < 5; page++) {
    const query = startingAfter
      ? `/customers/${customerId}/payment_methods?type=card&limit=100&starting_after=${startingAfter}`
      : `/customers/${customerId}/payment_methods?type=card&limit=100`;
    const list = await stripe(env, query);
    const data = Array.isArray(list.data) ? list.data : [];
    cards.push(...data);
    if (!list.has_more || data.length === 0) break;
    const next = stripeId(data[data.length - 1]?.id, "pm_");
    if (!next) break;
    startingAfter = next;
  }
  return cards;
}

function alreadyDetached(err) {
  return err?.status === 404 || /not attached|no such payment_method/i.test(err?.message || "");
}

function brandName(brand) {
  const known = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    diners: "Diners",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  const key = String(brand || "").toLowerCase();
  return known[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "Card");
}

export function formatCardLabel(paymentMethod, now = new Date()) {
  const card = paymentMethod?.card || {};
  const last4 = /^\d{4}$/.test(card.last4 || "") ? card.last4 : "????";
  const month = Number(card.exp_month);
  const year = Number(card.exp_year);
  const exp = month >= 1 && month <= 12 && year >= 2000
    ? `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`
    : "??/??";
  const saved = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(now);
  return `Yes: ${brandName(card.brand)} ${last4} exp ${exp} (saved ${saved})`;
}

// Sets the new card as the default, detaches every other card, then tells Make.
// The payload never includes an email, including one typed on the Checkout page.
export async function recordSavedCard(env, checkoutSession, now = new Date()) {
  const meta = checkoutSession?.metadata || {};
  if (checkoutSession?.livemode === true) return { ignored: true, reason: "livemode" };
  if (checkoutSession?.mode !== "setup") return { ignored: true, reason: "mode" };
  if (meta.business !== BUSINESS) return { ignored: true, reason: "business" };
  const cid = meta.crm_customer_id;
  if (!/^LC-\d+$/.test(cid || "")) return { ignored: true, reason: "customer" };
  if (checkoutSession.client_reference_id && checkoutSession.client_reference_id !== cid) {
    return { ignored: true, reason: "reference" };
  }
  if (checkoutSession.status && checkoutSession.status !== "complete") {
    return { ignored: true, reason: "status" };
  }

  const customerId = stripeId(checkoutSession.customer, "cus_");
  const setiId = stripeId(checkoutSession.setup_intent, "seti_");
  if (!customerId || !setiId) throw new Error("missing stripe ids");

  const stripeCustomer = await stripe(env, `/customers/${customerId}`);
  if (!isOurCustomer(stripeCustomer, cid)) return { ignored: true, reason: "customer_metadata" };

  const setupIntent = await stripe(env, `/setup_intents/${setiId}`);
  if (setupIntent.status && setupIntent.status !== "succeeded") throw new Error("setup intent not succeeded");
  if (setupIntent.metadata?.business && setupIntent.metadata.business !== BUSINESS) {
    return { ignored: true, reason: "setup_intent_business" };
  }
  const pmId = stripeId(setupIntent.payment_method, "pm_");
  if (!pmId) throw new Error("missing payment method");
  const paymentMethod = setupIntent.payment_method?.id === pmId
    ? setupIntent.payment_method
    : await stripe(env, `/payment_methods/${pmId}`);

  const update = new URLSearchParams();
  update.set("invoice_settings[default_payment_method]", pmId);
  await stripe(env, `/customers/${customerId}`, "POST", update);

  let oldStillAttached = false;
  for (const card of await listCards(env, customerId)) {
    if (card.id === pmId || !stripeId(card.id, "pm_")) continue;
    try {
      await stripe(env, `/payment_methods/${card.id}/detach`, "POST");
    } catch (err) {
      if (alreadyDetached(err)) continue;
      oldStillAttached = true;
      console.error("card detach failed");
    }
  }

  const payload = {
    customer_id: cid,
    stripe_customer_id: customerId,
    card_label: formatCardLabel(paymentMethod, now),
    consent_version: String(meta.consent_version || ""),
    saved_at: now.toISOString(),
  };
  if (oldStillAttached) payload.old_card_still_attached = true;
  await sendToMake(env, "card_saved", payload);
  return { ok: true, oldStillAttached };
}

async function readJson(request) {
  try {
    const text = await request.text();
    if (text.length > 4000) return { error: json({ error: "Send JSON" }, 400) };
    const value = text ? JSON.parse(text) : {};
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { error: json({ error: "Send JSON" }, 400) };
    }
    return { value };
  } catch {
    return { error: json({ error: "Send JSON" }, 400) };
  }
}

// Flag first, so these paths look missing until the test secrets are set.
async function gate(request, env) {
  if (cardSaveMode(env) !== "test") return { error: notFound() };
  if (!sameOrigin(request)) return { error: json({ error: "Bad origin" }, 403) };
  const session = await getSession(request, env);
  if (!session) return { error: json({ signed_in: false }, 401) };
  if (await overLimit(env.LOGIN_IP_LIMITER, `card:${clientIp(request)}`)) {
    return { error: json({ error: `Too many tries. Please wait a minute and try again, or call ${PHONE}.` }, 429) };
  }
  let crm;
  try {
    crm = await readCrm(env);
  } catch (err) {
    return { error: serverError(err, "card crm") };
  }
  const [customer] = findCustomers(
    crm,
    (row) => row.Customer_ID === session.cid && normalizePhone(row.Phone) === session.phone
  );
  if (!customer) return { error: json({ signed_in: false }, 401) };
  if (!customerMaySaveCard(customer)) return { error: notFound() };
  return { session, customer };
}

export async function onSetup({ request, env }) {
  const gated = await gate(request, env);
  if (gated.error) return gated.error;
  const body = await readJson(request);
  if (body.error) return body.error;
  try {
    const stripeCustomer = await findOrCreateCustomer(env, gated.customer, gated.session);
    const customerId = stripeId(stripeCustomer?.id, "cus_");
    if (!customerId) throw new Error("missing customer");
    const version = await consentVersion();
    const message = consentMessage(gated.customer.Price_Per_Visit);
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const form = new URLSearchParams();
    form.set("mode", "setup");
    form.set("currency", "usd");
    // Approved plan: card only, so Apple Pay and Google Pay still show as card wallets.
    form.set("payment_method_types[0]", "card");
    form.set("customer", customerId);
    form.set("client_reference_id", gated.customer.Customer_ID);
    for (const [key, value] of [
      ["business", BUSINESS],
      ["crm_customer_id", gated.customer.Customer_ID],
      ["kind", "account_card_save"],
      ["consent_version", version],
    ]) {
      form.set(`metadata[${key}]`, value);
      form.set(`setup_intent_data[metadata][${key}]`, value);
    }
    form.set("setup_intent_data[description]", SETUP_DESCRIPTION);
    form.set("custom_text[submit][message]", message);
    form.set("success_url", SUCCESS_URL);
    form.set("cancel_url", CANCEL_URL);
    form.set("expires_at", String(expiresAt));
    form.set("integration_identifier", integrationIdentifier());
    const session = await stripe(env, "/checkout/sessions", "POST", form);
    if (typeof session.url !== "string" || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) {
      throw new Error("unexpected checkout url");
    }
    return json({ url: session.url });
  } catch (err) {
    return serverError(err, "card setup");
  }
}

export async function onConfirm({ request, env }) {
  const gated = await gate(request, env);
  if (gated.error) return gated.error;
  const body = await readJson(request);
  if (body.error) return body.error;
  const cs = stripeId(body.value.cs, "cs_test_");
  if (!cs) return json({ error: "Missing checkout session." }, 400);
  try {
    const checkoutSession = await stripe(env, `/checkout/sessions/${cs}`);
    if (checkoutSession.livemode === true) return notFound();
    const cid = gated.session.cid;
    const meta = checkoutSession.metadata || {};
    if (checkoutSession.client_reference_id !== cid || meta.business !== BUSINESS || meta.crm_customer_id !== cid) {
      return json({ error: "That checkout session doesn't match this account." }, 403);
    }
    if (checkoutSession.mode !== "setup" || checkoutSession.status !== "complete") {
      return json({ error: "That card wasn't saved." }, 409);
    }
    const result = await recordSavedCard(env, checkoutSession);
    if (result.ignored) return json({ error: "That card wasn't saved." }, 409);
    return json({ ok: true });
  } catch (err) {
    return serverError(err, "card confirm");
  }
}

export async function onRemove({ request, env }) {
  const gated = await gate(request, env);
  if (gated.error) return gated.error;
  const body = await readJson(request);
  if (body.error) return body.error;
  try {
    const stripeCustomer = await findOrCreateCustomer(env, gated.customer, gated.session, { create: false });
    if (stripeCustomer) {
      const customerId = stripeId(stripeCustomer.id, "cus_");
      for (const card of await listCards(env, customerId)) {
        if (!stripeId(card.id, "pm_")) continue;
        try {
          await stripe(env, `/payment_methods/${card.id}/detach`, "POST");
        } catch (err) {
          if (alreadyDetached(err)) continue;
          throw err;
        }
      }
    }
    await sendToMake(env, "card_removed", {
      customer_id: gated.customer.Customer_ID,
      removed_at: new Date().toISOString(),
    });
    return json({ ok: true });
  } catch (err) {
    return serverError(err, "card remove");
  }
}

export const setup = { onRequestPost: onSetup };
export const confirm = { onRequestPost: onConfirm };
export const remove = { onRequestPost: onRemove };
