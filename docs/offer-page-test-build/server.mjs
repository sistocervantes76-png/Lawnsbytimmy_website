/**
 * Local static + mock lead + Stripe TEST Payment Element (Lawnsbytimmy sandbox).
 * Secrets from /path/to/secrets/REDACTED{sk,pk} — never logged.
 * Refuses sk_live_ / pk_live_. Leads only hit /mock/lead.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8765);
const LEADS = path.join(__dirname, "mock-leads.jsonl");
const IDS = JSON.parse(fs.readFileSync(path.join(__dirname, "stripe-test-ids.json"), "utf8"));
const EXPECTED_ACCOUNT = "acct_REDACTED";
// Zone 2 (Sisto, Nov 7 2026): per-visit $55 ($45 + $10 trip fee) in these ZIPs; package $154 everywhere.
const ZONE2_ZIPS = ["33301", "33304", "33305", "33306", "33308", "33313", "33316"];
const isZone2 = (zip) => ZONE2_ZIPS.includes(String(zip || "").replace(/\D/g, "").slice(0, 5));
const OFFER_Z2_CENTS = Number(IDS.offer_zone2_amount_cents || 5500);

function loadSecret() {
  const file = "/path/to/secrets/REDACTED";
  let k = "";
  if (fs.existsSync(file)) k = fs.readFileSync(file, "utf8").trim();
  if (!k) k = (process.env.STRIPE_LAWNS_TEST_SK || "").trim();
  if (k.startsWith("sk_live_")) { console.error("REFUSING live Stripe secret."); process.exit(1); }
  if (!k.startsWith("sk_test_")) { console.error("Missing sk_test_ secret."); process.exit(1); }
  return k;
}

function loadPublishable() {
  const file = "/path/to/secrets/REDACTED";
  let k = "";
  if (fs.existsSync(file)) k = fs.readFileSync(file, "utf8").trim();
  if (!k) k = (process.env.STRIPE_LAWNS_TEST_PK || "").trim();
  if (k.startsWith("pk_live_")) { console.error("REFUSING live Stripe publishable key."); process.exit(1); }
  if (!k.startsWith("pk_test_")) { console.error("Missing pk_test_ publishable key."); process.exit(1); }
  return k;
}

const secret = loadSecret();
const publishable = loadPublishable();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json"
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function stripe(pathname, method = "GET", form = null) {
  const opts = { method, headers: { Authorization: `Bearer ${secret}` } };
  if (form) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = form.toString();
  }
  const res = await fetch("https://api.stripe.com/v1" + pathname, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function assertTestAccount() {
  const { ok, data } = await stripe("/account");
  if (!ok) {
    console.error("account_lookup_failed", data.error?.message);
    process.exit(1);
  }
  if (data.id !== EXPECTED_ACCOUNT) {
    console.error("REFUSING wrong Stripe account", data.id, "expected", EXPECTED_ACCOUNT);
    process.exit(1);
  }
  if (data.livemode === true) {
    console.error("REFUSING livemode account");
    process.exit(1);
  }
  console.log("Stripe TEST account ok", data.id, data.settings?.dashboard?.display_name || "");
}

/** Create Customer + unconfirmed PaymentIntent; return client_secret for Payment Element. */
async function createPaymentIntent(body) {
  const usePackage = !!body.upsell;
  const zone2 = !usePackage && isZone2(body.zip);
  const amount = usePackage ? IDS.package_amount_cents : (zone2 ? OFFER_Z2_CENTS : IDS.offer_amount_cents);
  const offerId = body.offer_id || (usePackage ? "prepaid_4_visits" : "small_yard_biweekly");
  const saveCard = body.save_card !== false;

  const crmCustomerId = String(body.crm_customer_id || body.customer?.crm_customer_id || body.metadata?.crm_customer_id || "").trim();
  const custParams = new URLSearchParams();
  custParams.set("metadata[business]", "lawns_by_timmy");
  if (crmCustomerId) custParams.set("metadata[crm_customer_id]", crmCustomerId);
  if (body.customer?.name) custParams.set("name", body.customer.name);
  if (body.customer?.phone) custParams.set("phone", body.customer.phone);
  if (body.customer?.email) custParams.set("email", body.customer.email);
  // Do not invent a test email when the customer did not provide one.
  custParams.set("metadata[source]", "offer-page");
  custParams.set("metadata[address]", String(body.customer?.address || "").slice(0, 450));
  const cust = await stripe("/customers", "POST", custParams);
  if (!cust.ok) return { error: cust.data.error?.message || "customer_failed" };

  const piParams = new URLSearchParams();
  piParams.set("metadata[business]", "lawns_by_timmy");
  if (crmCustomerId) piParams.set("metadata[crm_customer_id]", crmCustomerId);
  piParams.set("amount", String(amount));
  piParams.set("currency", "usd");
  piParams.set("customer", cust.data.id);
  piParams.set("payment_method_types[0]", "card");
  if (saveCard) piParams.set("setup_future_usage", "off_session");
  piParams.set("description", usePackage ? "4-visit package $154 (first visit $19, then 3 at $45; recurring only)" : (zone2 ? "Small-yard bi-weekly visit $55 incl. $10 trip fee (recurring only)" : "Small-yard bi-weekly visit $45 (recurring only)"));
  piParams.set("metadata[source]", "offer-page");
  piParams.set("metadata[placeholder]", "false");
  piParams.set("metadata[source]", "sisto-2026-11-05");
  piParams.set("metadata[recurring_only]", "true");
  piParams.set("metadata[offer_id]", offerId);
  piParams.set("metadata[zone]", isZone2(body.zip) ? "2" : "1_or_other");
  piParams.set("metadata[address]", String(body.customer?.address || "").slice(0, 450));

  const pi = await stripe("/payment_intents", "POST", piParams);
  if (!pi.ok) {
    console.error("pi_REDACTED_failed", pi.data.error?.message, pi.data.error?.code);
    return { error: pi.data.error?.message || "pi_REDACTED", detail: pi.data.error };
  }

  console.log("pi_REDACTED", pi.data.id, "status=" + pi.data.status, "cus=" + cust.data.id, "amt=" + amount);
  return {
    mock: false,
    mode: "payment_element",
    clientSecret: pi.data.client_secret,
    payment_intent_id: pi.data.id,
    customer_id: cust.data.id,
    amount,
    currency: "usd",
    setup_future_usage: pi.data.setup_future_usage || null,
    offer_id: offerId,
    publishableKeyPresent: true
  };
}

/** Update amount / setup_future_usage when upsell or save-card toggles. */
async function updatePaymentIntent(body) {
  const piId = body.payment_intent_id;
  if (!piId || !String(piId).startsWith("pi_")) return { error: "payment_intent_id required" };
  const usePackage = !!body.upsell;
  const zone2 = !usePackage && isZone2(body.zip);
  const amount = usePackage ? IDS.package_amount_cents : (zone2 ? OFFER_Z2_CENTS : IDS.offer_amount_cents);
  const offerId = body.offer_id || (usePackage ? "prepaid_4_visits" : "small_yard_biweekly");
  const params = new URLSearchParams();
  params.set("amount", String(amount));
  params.set("description", usePackage ? "4-visit package $154 (first visit $19, then 3 at $45; recurring only)" : (zone2 ? "Small-yard bi-weekly visit $55 incl. $10 trip fee (recurring only)" : "Small-yard bi-weekly visit $45 (recurring only)"));
  params.set("metadata[offer_id]", offerId);
  params.set("metadata[zone]", isZone2(body.zip) ? "2" : "1_or_other");
  params.set("metadata[placeholder]", "false");
  params.set("metadata[source]", "sisto-2026-11-05");
  params.set("metadata[recurring_only]", "true");
  if (body.save_card === false) {
    // Cannot clear setup_future_usage once set on some PIs; recreate instead if needed
  } else if (body.save_card !== false) {
    params.set("setup_future_usage", "off_session");
  }
  const pi = await stripe(`/payment_intents/${piId}`, "POST", params);
  if (!pi.ok) {
    console.error("pi_REDACTED_failed", pi.data.error?.message);
    return { error: pi.data.error?.message || "pi_REDACTED_failed" };
  }
  console.log("pi_REDACTED", pi.data.id, "amt=" + amount);
  return {
    mock: false,
    mode: "payment_element",
    clientSecret: pi.data.client_secret,
    payment_intent_id: pi.data.id,
    customer_id: typeof pi.data.customer === "string" ? pi.data.customer : pi.data.customer?.id,
    amount,
    currency: "usd",
    setup_future_usage: pi.data.setup_future_usage || null,
    offer_id: offerId
  };
}

async function paymentStatus(piId) {
  if (!piId || !String(piId).startsWith("pi_")) return { error: "pi_ id required" };
  const { ok, data } = await stripe(`/payment_intents/${piId}?expand[]=payment_method&expand[]=customer`);
  if (!ok) return { error: data.error?.message };
  const pm = data.payment_method;
  const customerId = typeof data.customer === "object" ? data.customer?.id : data.customer;
  let saved = [];
  if (customerId) {
    const list = await stripe(`/customers/${customerId}/payment_methods?type=card&limit=5`);
    saved = (list.data.data || []).map(x => ({ id: x.id, last4: x.card?.last4, brand: x.card?.brand }));
  }
  return {
    payment_intent_id: data.id,
    status: data.status,
    amount: data.amount,
    customer_id: customerId,
    last4: pm?.card?.last4 || saved[0]?.last4 || null,
    brand: pm?.card?.brand || saved[0]?.brand || null,
    payment_method_id: typeof pm === "object" ? pm?.id : data.payment_method,
    setup_future_usage: data.setup_future_usage,
    saved_payment_methods: saved
  };
}

await assertTestAccount();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }

  if (url.pathname === "/api/config" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify({
      checkout_mode: "payment_element",
      publishableKey: publishable,
      offer_price: IDS.offer_price,
      package_price: IDS.package_price,
      offer_amount_cents: IDS.offer_amount_cents,
      package_amount_cents: IDS.package_amount_cents,
      account: IDS.account,
      has_publishable_key: true
    }));
  }

  if (url.pathname === "/mock/lead" && req.method === "POST") {
    const raw = await readBody(req);
    let parsed; try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
    fs.appendFileSync(LEADS, JSON.stringify({ at: new Date().toISOString(), parsed }) + "\n");
    console.log("MOCK LEAD first=" + (parsed?.lead_data?.first_name || "?"));
    res.writeHead(200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify({ ok: true, mock: true }));
  }

  if (url.pathname === "/api/create-payment-intent" && req.method === "POST") {
    const raw = await readBody(req);
    let body = {}; try { body = JSON.parse(raw); } catch {}
    const out = await createPaymentIntent(body);
    res.writeHead(out.error ? 502 : 200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify(out));
  }

  if (url.pathname === "/api/update-payment-intent" && req.method === "POST") {
    const raw = await readBody(req);
    let body = {}; try { body = JSON.parse(raw); } catch {}
    const out = await updatePaymentIntent(body);
    res.writeHead(out.error ? 502 : 200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify(out));
  }

  // Back-compat alias used by older client; now creates unconfirmed PI for Elements
  if (url.pathname === "/api/create-checkout-session" && req.method === "POST") {
    const raw = await readBody(req);
    let body = {}; try { body = JSON.parse(raw); } catch {}
    const out = await createPaymentIntent(body);
    res.writeHead(out.error ? 502 : 200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify(out));
  }

  if (url.pathname === "/api/payment-status" && req.method === "GET") {
    const out = await paymentStatus(url.searchParams.get("payment_intent"));
    res.writeHead(out.error ? 400 : 200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify(out));
  }

  let filePath = path.join(__dirname, url.pathname === "/" ? "index.html" : url.pathname);
  if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); return res.end("not found");
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Lawns offer page http://127.0.0.1:${PORT}/?mock=1`);
  console.log(`Stripe TEST · account ${IDS.account} · Payment Element (pk+sk)`);
});
