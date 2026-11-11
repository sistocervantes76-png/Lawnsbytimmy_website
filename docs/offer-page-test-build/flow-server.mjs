/**
 * Lawns by Timmy — quote → ACCEPT → pay/save card → job done → charge/count → receipt → renewal.
 * TEST MODE ONLY. Stripe test sandbox acct_REDACTED. Refuses sk_live_.
 * Make does all Google Sheets I/O; this service holds the logic and Stripe calls,
 * and returns Sheets values:batchUpdate bodies for Make to write.
 * In test, every customer text is written to TEST_Msg_Log instead of being sent.
 */
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import { stripe, assertTest } from "./stripe.mjs";

const PORT = Number(process.env.PORT || 8770);
const BASE_URL = (process.env.BASE_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, "");
const MAKE_EVENTS_HOOK = process.env.MAKE_EVENTS_HOOK || "";
const WHSEC = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
const MAKE_AUTH_SECRET = fs.readFileSync("/path/to/secrets/REDACTED", "utf8").trim();
const PK = fs.readFileSync("/path/to/secrets/REDACTED", "utf8").trim();
if (!PK.startsWith("pk_test_")) { console.error("REFUSING non-test pk"); process.exit(1); }
const SPREADSHEET_ID = "REDACTED_SPREADSHEET_ID";
const TAB = {
  customers: process.env.TAB_CUSTOMERS || "TEST_Customers",
  jobs: process.env.TAB_JOBS || "TEST_Jobs",
  payments: process.env.TAB_PAYMENTS || "TEST_Payments",
  log: process.env.TAB_LOG || "TEST_Msg_Log",
};
const TEST_MODE = true; // texts are logged, never sent
const BUSINESS = "lawns_by_timmy";
// Zones copied from Make LBT_Quote (6246200) module 6, read Nov 5 2026.
const ZONE1 = ["33309", "33311", "33312", "33315", "33334"];
const ZONE2 = ["33301", "33304", "33305", "33306", "33308", "33313", "33316"];
const ZONE2_PACKAGE_ENABLED = true; // Sisto decided Nov 7, 2026: package ($154) everywhere; $55 per visit in zone 2 ZIPs ($45 + $10 trip fee).
const LINK_TTL_H = { start: 72, renewal: 24 * 7, recovery: 24 * 7 };
const LK = { pkg: "lbt_pkg4_small_biweekly", renew: "lbt_pkg4_renewal", z1: "lbt_visit_small_biweekly_z1", z2: "lbt_visit_small_biweekly_z2" };
const PHONE = "(954) 880-3500";

// ---------- tiny JSON stores (Worker KV in production) ----------
const DATA = new URL("./data/", import.meta.url).pathname;
const store = (name) => {
  const f = DATA + name + ".json";
  return {
    all() { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; } },
    get(k) { return this.all()[k]; },
    set(k, v) { const a = this.all(); a[k] = v; fs.writeFileSync(f, JSON.stringify(a, null, 1)); return v; },
  };
};
const links = store("links"), events = store("events"), jobsLedger = store("jobs"), cusMap = store("customers");
const log = (...a) => console.log(new Date().toISOString(), ...a);

// ---------- helpers ----------
const fmtDate = (d) => d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric", year: "numeric" });
const fmtWhen = (d = new Date()) => d.toLocaleString("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", "");
// USER_ENTERED would turn "+1954…" into a number and "+…"/"=…" text into a formula; force text.
const cell = (v) => (typeof v === "string" && /^[+=\-@]/.test(v) ? "'" + v : v);
const ymd = (d) => { const [m, dd, y] = fmtDate(d).split("/"); return `${y}${m.padStart(2, "0")}${dd.padStart(2, "0")}`; };
const money = (c) => "$" + (c / 100).toFixed(2);
function e164(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d[0] === "1") return "+" + d;
  return d ? "+" + d : "";
}
function parseUSDate(s) { const m = String(s || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], 16)) : null; }
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
function colLetter(i) { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
const cents = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, "")); return isNaN(n) ? null : Math.round(n * 100); };
function zoneOf(zip, address) {
  let z = String(zip || "").trim().slice(0, 5);
  if (!/^\d{5}$/.test(z)) { const m = String(address || "").match(/\b(33\d{3})\b/); z = m ? m[1] : ""; }
  if (ZONE1.includes(z)) return 1; if (ZONE2.includes(z)) return 2; return 3;
}
const newId = () => crypto.randomBytes(12).toString("base64url");

// Parse Make's batchGet body: { valueRanges:[{range, values}] }
function parseSheets(sheets) {
  const out = {};
  for (const vr of (sheets?.valueRanges || [])) {
    const tab = vr.range.split("!")[0].replace(/^'|'$/g, "");
    const values = vr.values || [];
    const header = values[0] || [];
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const rows = values.slice(1).map((r, i) => ({ rowNumber: i + 2, cells: r, get: (h) => (idx[h] === undefined ? "" : (r[idx[h]] ?? "")) }));
    out[tab] = { header, idx, rows, nextRow: values.length + 1 };
  }
  return out;
}
class Batch {
  constructor(sheets) { this.s = sheets; this.data = []; this.sms = []; this.alerts = []; }
  set(tab, rowNumber, h, value) {
    const t = this.s[tab]; const i = t?.idx[h];
    if (i === undefined) throw new Error(`missing column ${h} in ${tab}`);
    this.data.push({ range: `'${tab}'!${colLetter(i)}${rowNumber}`, values: [[cell(value)]] });
  }
  append(tab, obj) {
    const t = this.s[tab]; if (!t) throw new Error("missing tab " + tab);
    const row = t.header.map((h) => cell(obj[h] ?? ""));
    for (const k of Object.keys(obj)) if (t.idx[k] === undefined) throw new Error(`missing column ${k} in ${tab}`);
    this.data.push({ range: `'${tab}'!A${t.nextRow}`, values: [row] });
    t.nextRow++;
  }
  text(to, text, kind, cid, ref = "") {
    this.sms.push({ to, text });
    this.append(TAB.log, { When_ET: fmtWhen(), To: to, Would_Send_Via: TEST_MODE ? "SMS (TEST: logged only, not sent)" : "SMS", Kind: kind, Message: text, Customer_ID: cid, Ref: ref });
  }
  alert(text, cid, ref = "") {
    this.alerts.push(text);
    this.append(TAB.log, { When_ET: fmtWhen(), To: "info@lawnsbytimmy.com", Would_Send_Via: TEST_MODE ? "Email to Sisto (TEST: logged only)" : "Email", Kind: "alert_sisto", Message: text, Customer_ID: cid, Ref: ref });
  }
  body() { return { batch_body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: this.data }), writes: this.data.length, sms: this.sms, alerts: this.alerts }; }
}

const priceCache = {};
async function priceByKey(key) {
  if (priceCache[key]) return priceCache[key];
  const r = await stripe(`/prices?lookup_keys[]=${key}&active=true`);
  const p = r.data.data?.[0];
  if (!p || p.livemode !== false || p.metadata?.business !== BUSINESS) throw new Error("price missing or not a Lawns test price: " + key);
  return (priceCache[key] = p);
}

function makeLink(kind, payload) {
  const id = newId();
  links.set(id, { id, kind, ...payload, created: Date.now(), exp: Date.now() + LINK_TTL_H[kind] * 3600e3 });
  return `${BASE_URL}/p/${id}`;
}

async function cardOf(pmId) {
  if (!pmId) return null;
  const r = await stripe(`/payment_methods/${pmId}`);
  return r.ok ? { brand: r.data.card?.brand, last4: r.data.card?.last4 } : null;
}
const cardLabel = (c) => (c ? `Yes – ${c.brand?.[0].toUpperCase()}${c.brand?.slice(1)} •• ${c.last4}` : "No");

async function ensureCustomer(link) {
  const known = cusMap.get(link.cid);
  if (known) return known;
  const r = await stripe("/customers", "POST", {
    name: link.name, phone: link.phone,
    metadata: { business: BUSINESS, crm_customer_id: link.cid, source: "accept-link" },
  }, `lbt-cus-${link.cid}`);
  if (!r.ok) throw new Error("customer_create_failed " + r.data.error?.message);
  return cusMap.set(link.cid, r.data.id);
}

// ---------- 1. ACCEPT ----------
async function handleAccept(body) {
  const from = e164(body.from);
  const S = parseSheets(body.sheets);
  const C = S[TAB.customers];
  if (!C) throw new Error("customers tab missing from payload");
  const b = new Batch(S);
  const matches = C.rows.filter((r) => e164(r.get("Phone")) === from && from);
  const open = matches.filter((r) => ["new lead", "quoted", "quote accepted"].includes(String(r.get("Status")).trim().toLowerCase()));
  const row = open[open.length - 1];
  if (!row) {
    b.alert(matches.length ? `${from} texted ACCEPT, but their newest CRM row is "${matches[matches.length - 1].get("Status")}", not an open quote. No link sent. Check and reply by hand.` : `${from} texted ACCEPT, but no CRM row has that phone. No link sent. Reply by hand from RingCentral.`, matches.length ? matches[matches.length - 1].get("Customer_ID") : "", "accept_no_match");
    return { found: false, ...b.body() };
  }
  const cid = row.get("Customer_ID"), first = row.get("First_Name") || "there";
  const zone = zoneOf(row.get("Zip"), row.get("Service_Address"));
  const lot = String(row.get("Lot_Size")).toLowerCase(), freq = String(row.get("Frequency")).toLowerCase().replace(/[^a-z]/g, "");
  const ppv = cents(row.get("Price_Per_Visit"));
  const visitKey = zone === 1 ? LK.z1 : zone === 2 ? LK.z2 : null;
  let reason = "";
  if (!lot.startsWith("small")) reason = `lot size is "${row.get("Lot_Size") || "blank"}" (only small yards have an automatic price)`;
  else if (freq !== "biweekly") reason = `frequency is "${row.get("Frequency") || "blank"}" (offer is bi-weekly only)`;
  else if (!visitKey) reason = "ZIP is outside zones 1 and 2";
  let visitPrice = null;
  if (!reason) { visitPrice = await priceByKey(visitKey); if (ppv !== visitPrice.unit_amount) reason = `CRM Price_Per_Visit ${row.get("Price_Per_Visit") || "blank"} doesn't match the Stripe price ${money(visitPrice.unit_amount)}`; }
  b.set(TAB.customers, row.rowNumber, "Status", "Quote Accepted");
  b.set(TAB.customers, row.rowNumber, "Last_Updated", fmtWhen());
  if (reason) {
    b.set(TAB.customers, row.rowNumber, "Next_Action", "Timmy: send price by hand (no automatic pay link)");
    b.alert(`${first} (${from}, ${cid}) texted ACCEPT, but no automatic pay link went out: ${reason}. Send them a price by hand.`, cid, "accept_needs_timmy");
    return { found: true, eligible: false, reason, row_number: row.rowNumber, customer_id: cid, ...b.body() };
  }
  const pkgAllowed = zone === 1 || ZONE2_PACKAGE_ENABLED;
  const url = makeLink("start", { cid, name: [row.get("First_Name"), row.get("Last_Name")].join(" ").trim(), first, phone: from, address: row.get("Service_Address"), zone, visitKey, pkgAllowed, sheet_row: row.rowNumber });
  const linkId = url.split("/").pop();
  b.set(TAB.customers, row.rowNumber, "Next_Action", `Waiting on payment (pay link sent ${fmtWhen()})`);
  b.set(TAB.customers, row.rowNumber, "Follow_Up_Date", fmtDate(addDays(new Date(), 2)));
  const v = money(visitPrice.unit_amount).replace(".00", "");
  // Pay-link 2a for every zone (Sisto, Nov 7 2026): package offered everywhere; ${v} is $45 (zone 1) or $55 (zone 2).
  const text = `Thanks ${first}! Book Lawns by Timmy here: ${url} Choose the 4-visit package ($154 today: first cut $19, then 3 at $45) or ${v} per visit (card saved, charged after each visit). Bi-weekly only. Link good for 3 days. Reply STOP to opt out.`;
  b.text(from, text, "pay_link", cid, linkId);
  return { found: true, eligible: true, row_number: row.rowNumber, customer_id: cid, pay_url: url, ...b.body() };
}

// ---------- 2. pay page ----------
function linkOr404(id) {
  const l = links.get(id);
  if (!l) return { err: "This link isn't valid." };
  if (Date.now() > l.exp) return { err: `This link has expired. Text ACCEPT to ${PHONE} for a new one, or call us.` };
  return { l };
}
async function createIntent(id, body) {
  const { l, err } = linkOr404(id);
  if (err) return { error: err };
  const option = body.option;
  const save = !!body.save_card;
  const customer = await ensureCustomer(l);
  const md = { business: BUSINESS, crm_customer_id: l.cid, link_id: l.id };
  const allowed = { start: l.pkgAllowed ? ["package", "per_visit"] : ["per_visit"], renewal: ["renewal"], recovery: ["recovery"] }[l.kind];
  if (!allowed.includes(option)) return { error: "option_not_allowed" };
  if (option === "per_visit") {
    const p = await priceByKey(l.visitKey);
    const r = await stripe("/setup_intents", "POST", { customer, usage: "off_session", "payment_method_types[0]": "card", description: `Card on file: ${money(p.unit_amount)} per bi-weekly visit, charged after each visit`, metadata: { ...md, kind: "per_visit_setup", lookup_key: l.visitKey, price_cents: p.unit_amount } });
    if (!r.ok) return { error: r.data.error?.message };
    return { type: "setup", client_secret: r.data.client_secret, amount: 0 };
  }
  let amount, key, kind, desc, extra = {};
  if (option === "package") { const p = await priceByKey(LK.pkg); amount = p.unit_amount; key = LK.pkg; kind = "package"; desc = "4-visit package $154 (first cut $19, then 3 at $45; recurring bi-weekly only)"; }
  if (option === "renewal") { const p = await priceByKey(LK.renew); amount = p.unit_amount; key = LK.renew; kind = "renewal"; desc = "4-visit package renewal $139 (recurring bi-weekly only)"; }
  if (option === "recovery") { amount = l.amount; key = l.lookup_key; kind = "recovery"; desc = `Lawns by Timmy visit ${l.service_date} (${l.job_id}) — card retry`; extra = { job_id: l.job_id, failed_pi: l.failed_pi }; }
  const params = { amount, currency: "usd", customer, "payment_method_types[0]": "card", description: desc, metadata: { ...md, kind, lookup_key: key, save_card: String(save || option === "recovery"), visits: kind === "recovery" ? "" : "4", ...extra } };
  if (save || option === "recovery") params.setup_future_usage = "off_session";
  const r = await stripe("/payment_intents", "POST", params);
  if (!r.ok) return { error: r.data.error?.message };
  return { type: "payment", client_secret: r.data.client_secret, amount };
}

const TERMS = `<ul class="terms"><li>Recurring bi-weekly service only. Package visits can't be split or used as one-time cuts.</li><li>Small yards up to 5,000 sq ft.</li><li>Catch-up for overgrown lawns is quoted separately. The $19 first-visit package rate does not replace catch-up.</li><li>Cancel early: unused visits become account credit (no cash refund).</li><li>Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service.</li><li>Renew the 4-visit package for $139.</li></ul>`;
async function payPage(id) {
  const { l, err } = linkOr404(id);
  const shell = (inner) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lawns by Timmy — secure checkout</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f4f7f2;color:#1b2b1b}main{max-width:440px;margin:0 auto;padding:18px}h1{font-size:22px;margin:6px 0 2px}.sub{color:#4a5a4a;margin:0 0 14px}.opt{display:block;background:#fff;border:2px solid #d5e0d0;border-radius:12px;padding:14px;margin:10px 0;cursor:pointer}.opt.sel{border-color:#2e7d32;box-shadow:0 0 0 2px #2e7d3233}.opt b{font-size:17px}.opt small{display:block;color:#4a5a4a;margin-top:4px}.terms{font-size:13px;color:#4a5a4a;padding-left:18px}.consent{font-size:13px;background:#fff8e1;border-radius:8px;padding:10px;margin:10px 0}button{width:100%;padding:15px;font-size:17px;border:0;border-radius:10px;background:#2e7d32;color:#fff;margin-top:12px}button:disabled{opacity:.5}#err{color:#b00020;margin-top:8px}.badge{display:inline-block;background:#fff3cd;color:#7a5b00;font-size:11px;padding:2px 6px;border-radius:6px}</style></head><body><main><span class="badge">TEST MODE — no real charges</span>${inner}</main></body></html>`;
  if (err) return shell(`<h1>Lawns by Timmy</h1><p>${err}</p>`);
  const vp = l.visitKey ? (await priceByKey(l.visitKey)).unit_amount : null;
  let opts = "";
  if (l.kind === "start") {
    if (l.pkgAllowed) opts += `<label class="opt sel" data-opt="package"><input type="radio" name="o" value="package" checked hidden><b>4-visit package — $154 today</b><small>Your first cut is $19, then 3 visits at $45. Bi-weekly.</small><label style="display:block;margin-top:8px;font-size:14px"><input type="checkbox" id="save"> Save my card for future visits (optional)</label></label>`;
    opts += `<label class="opt ${l.pkgAllowed ? "" : "sel"}" data-opt="per_visit"><input type="radio" name="o" value="per_visit" ${l.pkgAllowed ? "" : "checked"} hidden><b>${money(vp).replace(".00", "")} per visit</b><small>Nothing charged today. Your card is saved and charged after each completed visit.${l.zone === 2 ? " Includes the $10 trip fee for your area." : ""}</small></label>`;
  } else if (l.kind === "renewal") {
    opts += `<label class="opt sel" data-opt="renewal"><input type="radio" name="o" value="renewal" checked hidden><b>Renew 4 visits — $139</b><small>Bi-weekly, same as before.</small><label style="display:block;margin-top:8px;font-size:14px"><input type="checkbox" id="save" checked> Save my card for future visits (optional)</label></label>`;
  } else {
    opts += `<label class="opt sel" data-opt="recovery"><input type="radio" name="o" value="recovery" checked hidden><b>Pay ${money(l.amount)} for your ${l.service_date} visit</b><small>Your card on file was declined. This card will be saved for your next visits.</small></label>`;
  }
  const consent = `<div class="consent" id="consent">By saving your card, you let Lawns by Timmy charge it after each completed bi-weekly visit at your quoted price${vp ? ` (${money(vp).replace(".00", "")} per visit)` : ""}, or for package renewals you agree to. Text or call ${PHONE} to update or remove your card. [DRAFT wording — Sisto to approve]</div>`;
  return shell(`<h1>Hi ${l.first || "there"} 👋</h1><p class="sub">${l.address || ""}</p>${opts}${consent}${TERMS}<div id="pe" style="margin-top:12px"></div><button id="go">Continue</button><div id="err"></div>
<script src="https://js.stripe.com/v3/"></script><script>
const stripe=Stripe(${JSON.stringify(PK)});let elements=null,type=null;
document.querySelectorAll('.opt').forEach(o=>o.addEventListener('click',e=>{if(elements)return;document.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');o.querySelector('input[type=radio]').checked=true;}));
const go=document.getElementById('go'),errEl=document.getElementById('err');
go.onclick=async()=>{errEl.textContent='';go.disabled=true;
 try{ if(!elements){const option=document.querySelector('input[name=o]:checked').value;const save=!!document.getElementById('save')?.checked;
   const r=await fetch(location.pathname+'/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({option,save_card:save})}).then(r=>r.json());
   if(r.error)throw new Error(r.error);type=r.type;elements=stripe.elements({clientSecret:r.client_secret});elements.create('payment',{fields:{billingDetails:{address:{country:'never'}}}}).mount('#pe');
   go.textContent=r.type==='setup'?'Save card':'Pay '+(r.amount/100).toLocaleString('en-US',{style:'currency',currency:'USD'});window.__LBT={option,type:r.type};go.disabled=false;return;}
   const ret=location.origin+location.pathname+'/done';
   const fn=type==='setup'?stripe.confirmSetup:stripe.confirmPayment;
   const {error}=await fn({elements,confirmParams:{return_url:ret,payment_method_data:{billing_details:{address:{country:'US'}}}}});
   if(error)throw new Error(error.message);
 }catch(e){errEl.textContent=e.message;go.disabled=false;}};
</script>`);
}
async function donePage(id, q) {
  const l = links.get(id) || {};
  let msg = "We couldn't confirm that yet. If you were charged, we'll text you.";
  if (q.get("payment_intent")) { const r = await stripe(`/payment_intents/${q.get("payment_intent")}`); if (r.data?.status === "succeeded") msg = `Paid ${money(r.data.amount)}. Thank you!` + (l.kind === "start" ? " Timmy will text you to set your first visit." : l.kind === "renewal" ? " Your next visits stay on your bi-weekly schedule." : " Your new card is saved for next time."); else msg = "Payment status: " + r.data?.status; }
  if (q.get("setup_intent")) { const r = await stripe(`/setup_intents/${q.get("setup_intent")}`); if (r.data?.status === "succeeded") msg = "Your card is saved. Nothing was charged today. We'll charge after each completed visit. Timmy will text you to set your first visit."; else msg = "Card status: " + r.data?.status; }
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;max-width:440px;margin:30px auto;padding:0 18px"><span style="background:#fff3cd;font-size:11px;padding:2px 6px;border-radius:6px">TEST MODE</span><h1 id="done">You're all set${l.first ? ", " + l.first : ""}!</h1><p id="msg">${msg}</p><p>Questions? Call or text ${PHONE}.</p></body>`;
}

// ---------- 3. Stripe webhook ----------
function verifySig(raw, header) {
  if (!WHSEC) throw new Error("no webhook secret configured");
  const parts = Object.fromEntries(String(header || "").split(",").map((p) => p.split("=")).map(([k, ...v]) => [k, v.join("=")]));
  const sigs = String(header || "").split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) throw new Error("timestamp outside tolerance");
  const expected = crypto.createHmac("sha256", WHSEC).update(`${t}.${raw}`).digest("hex");
  if (!sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)))) throw new Error("bad signature");
}
async function handleStripeWebhook(raw, sig) {
  verifySig(raw, sig);
  const ev = JSON.parse(raw);
  if (events.get(ev.id)) return { duplicate: true, id: ev.id };
  const obj = ev.data?.object || {};
  if (ev.livemode !== false) { events.set(ev.id, { ignored: "livemode" }); return { ignored: "livemode" }; }
  if (obj.metadata?.business !== BUSINESS) { events.set(ev.id, { ignored: "not_lawns", type: ev.type }); return { ignored: "not_lawns" }; }
  const kind = obj.metadata.kind;
  let norm = null;
  if (ev.type === "payment_intent.succeeded" && ["package", "renewal", "recovery"].includes(kind)) {
    const saved = obj.setup_future_usage === "off_session";
    if (saved && obj.payment_method) await stripe(`/customers/${obj.customer}`, "POST", { "invoice_settings[default_payment_method]": obj.payment_method });
    norm = { type: kind + "_paid", crm_customer_id: obj.metadata.crm_customer_id, stripe_customer: obj.customer, ref: obj.id, amount: obj.amount, card: await cardOf(obj.payment_method), saved, job_id: obj.metadata.job_id || "", lookup_key: obj.metadata.lookup_key };
  } else if (ev.type === "setup_intent.succeeded" && kind === "per_visit_setup") {
    await stripe(`/customers/${obj.customer}`, "POST", { "invoice_settings[default_payment_method]": obj.payment_method });
    norm = { type: "card_saved", crm_customer_id: obj.metadata.crm_customer_id, stripe_customer: obj.customer, ref: obj.id, amount: 0, card: await cardOf(obj.payment_method), saved: true, lookup_key: obj.metadata.lookup_key, price_cents: Number(obj.metadata.price_cents) };
  }
  if (!norm) { events.set(ev.id, { ignored: "not_needed", type: ev.type, kind }); return { ignored: "not_needed", type: ev.type, kind }; }
  events.set(ev.id, { state: "pending", type: ev.type, received: new Date().toISOString(), norm });
  if (MAKE_EVENTS_HOOK) {
    const r = await fetch(MAKE_EVENTS_HOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "stripe_update", event_id: ev.id, type: norm.type, crm_customer_id: norm.crm_customer_id }) });
    log("forwarded to Make", ev.id, r.status);
  }
  return { queued: ev.id, type: norm.type };
}
function nextJobId(S, cid) {
  const J = S[TAB.jobs]; const n = J.rows.filter((r) => r.get("Customer_ID") === cid).length + 1 + (J._added?.[cid] || 0);
  J._added = { ...(J._added || {}), [cid]: (J._added?.[cid] || 0) + 1 };
  return `JOB-${cid}-V${n}`;
}
async function applyEvent(body) {
  const rec = events.get(body.event_id);
  if (!rec?.norm) return { error: "unknown_event", batch_body: "", writes: 0 };
  if (rec.state === "applied") return { already_applied: true, batch_body: "", writes: 0 };
  const S = parseSheets(body.sheets); const b = new Batch(S); const n = rec.norm;
  const row = S[TAB.customers].rows.filter((r) => r.get("Customer_ID") === n.crm_customer_id).pop();
  if (!row) { b.alert(`Stripe ${n.type} for ${n.crm_customer_id} (${n.ref}) has no CRM row. Check by hand.`, n.crm_customer_id, n.ref); return { ...b.body() }; }
  const cid = n.crm_customer_id, first = row.get("First_Name") || "there", phone = e164(row.get("Phone"));
  const today = fmtDate(new Date()), now = fmtWhen();
  const set = (h, v) => b.set(TAB.customers, row.rowNumber, h, v);
  set("Last_Updated", now); set("Stripe_Customer_ID", n.stripe_customer);
  if (n.saved) set("Card_On_File", cardLabel(n.card)); else if (!row.get("Card_On_File")) set("Card_On_File", "No");
  const nextDate = row.get("Next_Service_Date");
  const jobBase = { Customer_ID: cid, Customer_Name: [row.get("First_Name"), row.get("Last_Name")].join(" ").trim(), Address: row.get("Service_Address"), Job_Status: "Scheduled", Service_Date: nextDate };
  if (n.type === "package_paid" || n.type === "renewal_paid") {
    const left = (parseInt(row.get("Visits_Left")) || 0) + 4;
    set("Status", "Active Recurring"); set("Payment_Method", "Stripe card – package"); set("Visits_Left", left); set("Frequency", "Bi-Weekly");
    set("Next_Action", nextDate ? "" : "Timmy: set first visit date (Service_Date on the new job row)");
    b.append(TAB.payments, { Payment_ID: `PAY-${ymd(new Date())}-${cid}-${n.type === "renewal_paid" ? "RENEW" : "PKG"}`, Date: today, Customer_ID: cid, Stripe_Reference: n.ref, Amount: n.amount / 100, Method: `Card (Stripe) – ${n.type === "renewal_paid" ? "4-visit renewal" : "4-visit package"}`, Payment_Status: "Paid" });
    const hasOpenJob = S[TAB.jobs].rows.some((r) => r.get("Customer_ID") === cid && String(r.get("Job_Status")).toLowerCase() === "scheduled");
    if (!hasOpenJob) b.append(TAB.jobs, { ...jobBase, Job_ID: nextJobId(S, cid), Service_Type: "Mow (package)", Price: "Prepaid", Job_Notes: nextDate ? "" : "Set Service_Date" });
    b.text(phone, n.type === "renewal_paid"
      ? `Thanks ${first}! Your 4-visit renewal is paid (${money(n.amount)}). You have ${left} visits left. Questions? Call or text ${PHONE}.`
      : `Thanks ${first}! Your 4-visit package is paid (${money(n.amount)}). Your first cut counts as the $19 visit. Timmy will text you to set your first visit. Questions? Call or text ${PHONE}.`, n.type === "renewal_paid" ? "receipt_renewal" : "receipt_package", cid, n.ref);
    if (!nextDate || hasOpenJob === false) b.alert(`${first} (${cid}) paid ${money(n.amount)} (${n.type === "renewal_paid" ? "renewal" : "4-visit package"}). ${nextDate ? `Next visit ${nextDate} is on the Jobs tab.` : "Set the first visit date on the new Jobs row, then text them the day (manual)."}`, cid, n.ref);
  } else if (n.type === "card_saved") {
    set("Status", "Active Recurring"); set("Payment_Method", "Stripe card – per visit"); set("Frequency", "Bi-Weekly");
    set("Next_Action", nextDate ? "" : "Timmy: set first visit date (Service_Date on the new job row)");
    b.append(TAB.jobs, { ...jobBase, Job_ID: nextJobId(S, cid), Service_Type: "Mow (per visit)", Price: n.price_cents / 100, Job_Notes: nextDate ? "" : "Set Service_Date" });
    b.text(phone, `Thanks ${first}! Your card ending ${n.card?.last4} is saved. Nothing was charged today; we'll charge ${money(n.price_cents)} after each completed visit. Timmy will text you to set your first visit. Questions? Call or text ${PHONE}.`, "receipt_card_saved", cid, n.ref);
    b.alert(`${first} (${cid}) saved a card for ${money(n.price_cents)} per visit. Set the first visit date on the new Jobs row, then text them the day (manual).`, cid, n.ref);
  } else if (n.type === "recovery_paid") {
    set("Status", "Active Recurring"); set("Next_Action", "");
    const jr = S[TAB.jobs].rows.find((r) => r.get("Job_ID") === n.job_id);
    if (jr) b.set(TAB.jobs, jr.rowNumber, "Billing_Status", "Paid (card, after retry)");
    b.append(TAB.payments, { Payment_ID: `PAY-${n.job_id.replace(/^JOB-/, "")}-RETRY`, Date: today, Customer_ID: cid, Stripe_Reference: n.ref, Amount: n.amount / 100, Method: "Card (Stripe) – retry link", Payment_Status: "Paid", Job_ID: n.job_id });
    if (jr) { const sd = parseUSDate(jr.get("Service_Date")) || new Date(); const nd = fmtDate(addDays(sd, 14)); set("Next_Service_Date", nd);
      b.append(TAB.jobs, { ...jobBase, Service_Date: nd, Job_ID: nextJobId(S, cid), Service_Type: "Mow (per visit)", Price: cents(row.get("Price_Per_Visit")) / 100 }); }
    b.text(phone, `Thanks ${first}! We got your payment of ${money(n.amount)}, and your new card ending ${n.card?.last4} is saved for next time. Questions? Call or text ${PHONE}.`, "receipt_retry", cid, n.ref);
  }
  events.set(body.event_id, { ...rec, state: "built", built: new Date().toISOString() });
  return { ...b.body(), event_type: n.type };
}
function ack(body) { const rec = events.get(body.event_id); if (rec) events.set(body.event_id, { ...rec, state: "applied", applied: new Date().toISOString() }); return { ok: !!rec }; }

// ---------- 4/5. Job done ----------
async function processJobs(body) {
  const S = parseSheets(body.sheets); const b = new Batch(S);
  const J = S[TAB.jobs], C = S[TAB.customers];
  const results = [];
  for (const jr of J.rows) {
    if (String(jr.get("Job_Status")).trim().toLowerCase() !== "completed" || String(jr.get("Billing_Status")).trim()) continue;
    const jobId = jr.get("Job_ID"), cid = jr.get("Customer_ID");
    const cr = C.rows.filter((r) => r.get("Customer_ID") === cid).pop();
    const pm = String(cr?.get("Payment_Method") || "").toLowerCase();
    if (!cr || !pm.startsWith("stripe card")) { results.push({ jobId, skipped: "not a Stripe customer" }); continue; }
    const first = cr.get("First_Name") || "there", phone = e164(cr.get("Phone")), addr = cr.get("Service_Address");
    const sdate = parseUSDate(jr.get("Service_Date")) || new Date(); const sdStr = jr.get("Service_Date") || fmtDate(new Date());
    const nextDate = fmtDate(addDays(sdate, 14));
    const setJ = (h, v) => b.set(TAB.jobs, jr.rowNumber, h, v), setC = (h, v) => b.set(TAB.customers, cr.rowNumber, h, v);
    setJ("Completed_At", jr.get("Completed_At") || fmtWhen());
    if (jr.get("Job_Notes") === "Set Service_Date") setJ("Job_Notes", "");
    if (String(cr.get("Next_Action")).startsWith("Timmy: set first visit date")) setC("Next_Action", ""); setC("Last_Visit", sdStr); setC("Last_Updated", fmtWhen());
    const jobBase = { Customer_ID: cid, Customer_Name: jr.get("Customer_Name"), Address: jr.get("Address"), Job_Status: "Scheduled", Service_Date: nextDate };
    if (pm.includes("package")) {
      const left = parseInt(cr.get("Visits_Left")) || 0;
      if (left <= 0) { setJ("Billing_Status", "HOLD: no package visits left"); b.alert(`${first} (${cid}) job ${jobId} was marked Completed but has 0 package visits left. Nothing charged. Decide by hand.`, cid, jobId); results.push({ jobId, hold: "no visits" }); continue; }
      const nl = left - 1;
      setJ("Billing_Status", `Prepaid – package (${nl} left)`); setC("Visits_Left", nl);
      b.text(phone, `Hi ${first}, today's lawn visit at ${addr} is done. That used 1 prepaid package visit; ${nl} left. Questions? Call or text ${PHONE}. Quick feedback: reply with a number 1-5 (5 = great).`, "receipt_package_visit", cid, jobId);
      if (nl > 0) { setC("Next_Service_Date", nextDate); b.append(TAB.jobs, { ...jobBase, Job_ID: nextJobId(S, cid), Service_Type: "Mow (package)", Price: "Prepaid" }); }
      else {
        setC("Next_Service_Date", nextDate); setC("Status", "Renewal Due"); setC("Next_Action", `Renewal link ($139) sent ${fmtWhen()}`);
        const url = makeLink("renewal", { cid, name: jr.get("Customer_Name"), first, phone, address: addr, zone: zoneOf(cr.get("Zip"), addr), sheet_row: cr.rowNumber });
        b.text(phone, `${first}, that was the last visit in your package. Keep your bi-weekly spot: renew 4 visits for $139 here: ${url} Bi-weekly only. Reply STOP to opt out.`, "renewal_offer", cid, url.split("/").pop());
        results.push({ jobId, renewal_url: url });
      }
      results.push({ jobId, package_left: nl });
      continue;
    }
    // per visit: off-session charge
    const amount = cents(jr.get("Price")), ppv = cents(cr.get("Price_Per_Visit"));
    const key = zoneOf(cr.get("Zip"), addr) === 2 ? LK.z2 : LK.z1;
    const price = await priceByKey(key);
    if (amount !== ppv || amount !== price.unit_amount) { setJ("Billing_Status", `HOLD: price ${jr.get("Price") || "blank"} isn't the saved ${money(price.unit_amount)}`); b.alert(`${first} (${cid}) job ${jobId}: Price ${jr.get("Price") || "blank"} doesn't match the saved per-visit price ${money(price.unit_amount)}. Not charged automatically (catch-up and extras are charged by hand).`, cid, jobId); results.push({ jobId, hold: "price mismatch" }); continue; }
    const cus = cr.get("Stripe_Customer_ID");
    let ledger = jobsLedger.get(jobId);
    let pi;
    if (ledger?.pi) { pi = (await stripe(`/payment_intents/${ledger.pi}`)).data; }
    else {
      const c = (await stripe(`/customers/${cus}`)).data;
      if (c?.metadata?.business !== BUSINESS || c.livemode !== false) throw new Error("customer not a Lawns test customer: " + cus);
      const pmId = c.invoice_settings?.default_payment_method || (await stripe(`/customers/${cus}/payment_methods?type=card&limit=1`)).data.data?.[0]?.id;
      const r = await stripe("/payment_intents", "POST", { amount, currency: "usd", customer: cus, payment_method: pmId, off_session: "true", confirm: "true", "payment_method_types[0]": "card", description: `Lawns by Timmy visit ${sdStr} (${jobId})`, metadata: { business: BUSINESS, crm_customer_id: cid, kind: "visit_charge", job_id: jobId, lookup_key: key } }, `lbt-visit-${jobId}`);
      pi = r.ok ? r.data : (r.data.error?.payment_intent || { status: "failed", id: null, last_payment_error: r.data.error, _http: r.status });
      jobsLedger.set(jobId, { pi: pi.id, status: pi.status, http: r.status, code: r.data.error?.code, decline: r.data.error?.decline_code, at: new Date().toISOString() });
    }
    const card = await cardOf(typeof pi.payment_method === "string" ? pi.payment_method : pi.last_payment_error?.payment_method?.id || pi.payment_method?.id);
    if (pi.status === "succeeded") {
      setJ("Billing_Status", "Paid (card)"); setC("Next_Service_Date", nextDate);
      b.append(TAB.payments, { Payment_ID: `PAY-${jobId.replace(/^JOB-/, "")}`, Date: fmtDate(new Date()), Customer_ID: cid, Stripe_Reference: pi.id, Amount: amount / 100, Method: "Card (Stripe) – off-session", Payment_Status: "Paid", Job_ID: jobId });
      b.append(TAB.jobs, { ...jobBase, Job_ID: nextJobId(S, cid), Service_Type: "Mow (per visit)", Price: ppv / 100 });
      b.text(phone, `Hi ${first}, today's lawn service at ${addr} is done. We charged ${money(amount)} to your card ending ${card?.last4}. Questions? Call or text ${PHONE}. Quick feedback: reply with a number 1-5 (5 = great).`, "receipt_visit_charge", cid, pi.id);
      results.push({ jobId, charged: pi.id });
    } else {
      const err = pi.last_payment_error || {}; const reason = [err.code, err.decline_code].filter(Boolean).join("/") || pi.status;
      setJ("Billing_Status", "Payment failed"); setC("Status", "Payment failed"); setC("Next_Action", `Card declined (${reason}); retry link sent ${fmtWhen()}`);
      b.append(TAB.payments, { Payment_ID: `PAY-${jobId.replace(/^JOB-/, "")}`, Date: fmtDate(new Date()), Customer_ID: cid, Stripe_Reference: pi.id || "", Amount: amount / 100, Method: "Card (Stripe) – off-session", Payment_Status: "Failed", Failure_Reason: reason, Job_ID: jobId });
      const url = makeLink("recovery", { cid, name: jr.get("Customer_Name"), first, phone, address: addr, job_id: jobId, amount, lookup_key: key, service_date: sdStr, failed_pi: pi.id || "" });
      b.text(phone, `Hi ${first}, today's lawn service at ${addr} is done, but your card ending ${card?.last4 || "on file"} was declined for ${money(amount)}. Please pay here: ${url} Questions? Call or text ${PHONE}.`, "payment_failed_retry_link", cid, url.split("/").pop());
      b.alert(`Card declined for ${first} (${cid}) job ${jobId}, ${money(amount)} (${reason}). Retry link texted. Next visit is NOT scheduled until it's paid.`, cid, pi.id || jobId);
      results.push({ jobId, failed: pi.id, reason, retry_url: url });
    }
  }
  return { results, ...b.body() };
}

// ---------- server ----------
const readBody = (req) => new Promise((res, rej) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => res(Buffer.concat(c).toString("utf8"))); req.on("error", rej); });
const authed = (req) => { const t = String(req.headers["x-lbt-key"] || ""); return t.length === MAKE_AUTH_SECRET.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(MAKE_AUTH_SECRET)); };
await assertTest();
http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  const json = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  try {
    const raw = await readBody(req);
    const p = url.pathname;
    if (p === "/health") return json(200, { ok: true, test_mode: true });
    if (p === "/api/stripe/webhook" && req.method === "POST") { let r; try { r = await handleStripeWebhook(raw, req.headers["stripe-signature"]); } catch (e) { log("webhook REJECTED", e.message); return json(400, { error: e.message }); } log("webhook", JSON.stringify(r)); return json(200, r); }
    let m;
    if ((m = p.match(/^\/p\/([\w-]+)$/)) && req.method === "GET") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(await payPage(m[1])); }
    if ((m = p.match(/^\/p\/([\w-]+)\/intent$/)) && req.method === "POST") { const r = await createIntent(m[1], JSON.parse(raw || "{}")); log("intent", m[1], r.type, r.amount, r.error || ""); return json(r.error ? 400 : 200, r); }
    if ((m = p.match(/^\/p\/([\w-]+)\/done$/))) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(await donePage(m[1], url.searchParams)); }
    if (p.startsWith("/api/")) {
      if (!authed(req)) return json(401, { error: "unauthorized" });
      const body = JSON.parse(raw || "{}");
      if (p === "/api/accept") { const r = await handleAccept(body); log("accept", r.customer_id, r.eligible, r.writes); return json(200, r); }
      if (p === "/api/stripe/apply") { const r = await applyEvent(body); log("apply", body.event_id, r.event_type, r.writes); return json(200, r); }
      if (p === "/api/ack") return json(200, ack(body));
      if (p === "/api/jobs/process") { const r = await processJobs(body); log("jobs", JSON.stringify(r.results)); return json(200, r); }
    }
    json(404, { error: "not_found" });
  } catch (e) { log("ERR", e.message); json(500, { error: e.message }); }
}).listen(PORT, "0.0.0.0", () => log(`lbt flow (TEST) on :${PORT} base=${BASE_URL}`));
