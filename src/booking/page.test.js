// Runs the /book/ page script against a small fake DOM. Fictional data. No network.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../../book/index.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));

class El {
  constructor(id, attrs = {}) {
    Object.assign(this, { id, hidden: false, checked: false, disabled: false, textContent: "", href: "", children: [], listeners: {}, attrs: {} }, attrs);
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  async fire(type, event = {}) { for (const fn of this.listeners[type] || []) await fn({ preventDefault() {}, ...event }); }
  setAttribute(k, v) { this.attrs[k] = v; }
  replaceChildren(...kids) { this.children = kids; if (!kids.length) this.textContent = ""; }
  appendChild(kid) { this.children.push(kid); return kid; }
  append(...kids) { this.children.push(...kids); }
  querySelectorAll() { return this.children.flatMap((c) => (c.children || [])).flatMap((r) => r.children || []).filter((b) => b.tag === "button"); }
}

function idsIn(markup) {
  return [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
}

function page({ slotsStatus = 200, testMode = true, plans = ["package", "per_visit"] } = {}) {
  const els = {};
  for (const id of idsIn(html)) {
    const tag = html.match(new RegExp(`<(\\w+)[^>]*\\sid="${id}"`))[1];
    const attrs = { tag };
    const open = html.match(new RegExp(`<\\w+[^>]*\\sid="${id}"[^>]*>`))[0];
    if (/\shidden[\s>]/.test(open)) attrs.hidden = true;
    if (/\schecked[\s>]/.test(open)) attrs.checked = true;
    els[id] = new El(id, attrs);
  }
  const radios = ["plan", "pay_plan"].flatMap((name) => ["package", "per_visit"].map((value) => new El(`${name}-${value}`, {
    name, value, checked: name === "plan" && value === "package",
  })));
  const form = { first_name: "Test", last_name: "Booker", phone: "9545550123", email: "booker@example.test",
    address: "1 Test St", city: "Oakland Park", zip: "33309", yard: "yes" };
  const calls = [];
  let pendingUpdates = [];
  const respond = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
  const fetch = async (path, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path, body });
    if (path === "/api/book/config") return respond({ enabled: true, test_mode: testMode, plans, publishableKey: "pk_test_fictional", windows: [{ id: "0800-1000", label: "8–10 AM" }], cap_per_window: 2, min_lead_days: 2, max_lead_days: 21, hold_minutes: 15, package_cents: 15400, visit_cents: 4500, first_cut_cents: 1900 });
    if (path.startsWith("/api/book/quote")) return respond({ payable: true, package_cents: 15400, per_visit_cents: 4500 });
    if (path.startsWith("/api/book/slots")) {
      if (slotsStatus !== 200) return respond({ error: "We couldn't check the schedule. Please try again in a minute, use the instant quote form, or call (954) 880-3500.", reason: "schedule_unavailable", quote_url: "/#quote-form", phone: "(954) 880-3500" }, slotsStatus);
      return respond({ payable: true, days: [{ date: "2026-12-01", label: "Tue Dec 1", windows: [{ id: "0800-1000", label: "8–10 AM", open: 2 }] }] });
    }
    if (path === "/api/book/hold") return respond({ booking_id: "BK-0123456789abcdef", client_secret: "pi_x_secret_y", amount_cents: body.plan === "package" ? 15400 : 4500, plan: body.plan, save_card: body.save_card === true, label: "Tue Dec 1", window_label: "8–10 AM", visits: [{ n: 1, date: "12/1/2026", label: "Tue Dec 1" }] });
    if (path === "/api/book/update") {
      // Answer updates in order, after a tick, so overlapping clicks can be tested.
      await new Promise((r) => setTimeout(r, 5));
      return respond({ amount_cents: body.plan === "package" ? 15400 : 4500, plan: body.plan, save_card: body.save_card, client_secret: "pi_x_secret_y" });
    }
    if (path.startsWith("/api/book/status")) return respond({ status: "confirmed", label: "Tue Dec 1", window_label: "8–10 AM", amount_cents: 15400, card_last4: "3184", card_brand: "visa", visits: [] });
    return respond({ error: "unexpected" }, 500);
  };
  let stripeLoaded = null;
  const stripeReady = new Promise((r) => { stripeLoaded = r; });
  const confirmed = [];
  const created = [];
  const document = {
    getElementById: (id) => els[id],
    querySelectorAll: (sel) => radios.filter((r) => sel.split(",").some((s) => s.includes(`name=${r.name}]`))),
    querySelector: (sel) => radios.find((r) => sel.includes(`name=${r.name}]`) && (!sel.includes(":checked") || r.checked)) || null,
    createElement: (tag) => new El("", { tag }),
    head: { appendChild: (s) => stripeReady.then(() => s.onload()) },
  };
  class FormData {
    constructor(f) { this.f = f; }
    get(name) {
      if (name === "plan") return radios.find((r) => r.name === "plan" && r.checked)?.value || null;
      return form[name] ?? null;
    }
  }
  const ctx = {
    document, fetch, FormData, URLSearchParams, setTimeout, console, encodeURIComponent,
    location: { origin: "https://book.test", search: "" },
    window: { scrollTo() {} },
    Stripe: () => ({
      elements: () => ({ create: (type, options) => { created.push({ type, options }); return { mount() {} }; }, fetchUpdates: async () => {} }),
      confirmPayment: async () => { confirmed.push(calls.filter((c) => c.path === "/api/book/update").at(-1)?.body || null); return {}; },
    }),
  };
  ctx.window.Stripe = ctx.Stripe;
  vm.createContext(ctx);
  vm.runInContext(script, ctx);
  return { els, radios, calls, confirmed, created, stripeLoaded, settle: () => new Promise((r) => setTimeout(r, 40)) };
}

async function toPayStep(p, { loadStripe = true } = {}) {
  await p.settle();
  await p.els.details.fire("submit", { submitter: new El("submit") });
  await p.settle();
  const windowButton = p.els.days.children[0].children[1].children[0];
  await windowButton.fire("click");
  const going = p.els.continuePay.fire("click");
  await p.settle();
  if (loadStripe) { p.stripeLoaded(); await going; await p.settle(); }
  return { going };
}

const homeHtml = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const homeScript = homeHtml.slice(
  homeHtml.indexOf('<script id="bookPayScript">') + '<script id="bookPayScript">'.length,
  homeHtml.indexOf("</script>", homeHtml.indexOf('<script id="bookPayScript">')),
);

function homePage(configResponse) {
  const bookPay = { id: "bookPay", hidden: true };
  const fetch = async () => {
    if (typeof configResponse === "function") return configResponse();
    return configResponse;
  };
  const ctx = { document: { getElementById: () => bookPay }, fetch };
  vm.createContext(ctx);
  vm.runInContext(homeScript, ctx);
  return { bookPay, settle: () => new Promise((r) => setTimeout(r, 20)) };
}

describe("homepage book button", () => {
  test("stays hidden until live booking is on, and stays hidden on any failure", async () => {
    const live = homePage({ ok: true, json: async () => ({ enabled: true, test_mode: false }) });
    assert.equal(live.bookPay.hidden, true);
    await live.settle();
    assert.equal(live.bookPay.hidden, false);

    const testMode = homePage({ ok: true, json: async () => ({ enabled: true, test_mode: true }) });
    await testMode.settle();
    assert.equal(testMode.bookPay.hidden, true);

    const closed = homePage({ ok: false, status: 404, json: async () => ({ error: "Not found" }) });
    await closed.settle();
    assert.equal(closed.bookPay.hidden, true);

    const broken = homePage(() => { throw new Error("network"); });
    await broken.settle();
    assert.equal(broken.bookPay.hidden, true);

    const badJson = homePage({ ok: true, json: async () => { throw new Error("not json"); } });
    await badJson.settle();
    assert.equal(badJson.bookPay.hidden, true);
  });
});

describe("book page", () => {
  test("shows Loading… until config answers, never the closed card", async () => {
    const p = page();
    assert.equal(p.els.loading.hidden, false);
    assert.equal(p.els.closed.hidden, true);
    await p.settle();
    assert.equal(p.els.loading.hidden, true);
    assert.equal(p.els.closed.hidden, true);
    assert.equal(p.els.app.hidden, false);
  });

  test("save card starts unticked and the hold is sent with save_card false", async () => {
    const p = page();
    assert.equal(p.els.saveCard.checked, false);
    await toPayStep(p);
    const hold = p.calls.find((c) => c.path === "/api/book/hold");
    assert.equal(hold.body.save_card, false);
    assert.equal(hold.body.plan, "package");
  });

  test("the plan picked on the details step is selected on the payment step before the card form loads", async () => {
    const p = page();
    const { going } = await toPayStep(p, { loadStripe: false });
    assert.equal(p.els["step-pay"].hidden, false);
    assert.equal(p.radios.find((r) => r.name === "pay_plan" && r.value === "package").checked, true);
    assert.equal(p.els.payDue.textContent, "$154");
    p.stripeLoaded();
    await going;
  });

  test("unticking is kept through quick toggles, plan re-selection, and Pay", async () => {
    const p = page();
    await toPayStep(p);
    p.els.saveCard.checked = true;
    const a = p.els.saveCard.fire("change");
    p.els.saveCard.checked = false;
    const b = p.els.saveCard.fire("change");
    await a; await b; await p.settle();
    assert.equal(p.els.saveCard.checked, false);
    const perVisit = p.radios.find((r) => r.name === "pay_plan" && r.value === "per_visit");
    for (const r of p.radios.filter((x) => x.name === "pay_plan")) r.checked = r === perVisit;
    await perVisit.fire("change"); await p.settle();
    const pkg = p.radios.find((r) => r.name === "pay_plan" && r.value === "package");
    for (const r of p.radios.filter((x) => x.name === "pay_plan")) r.checked = r === pkg;
    await pkg.fire("change"); await p.settle();
    assert.equal(p.els.saveCard.checked, false);
    await p.els.payBtn.fire("click"); await p.settle();
    assert.equal(p.els.saveCard.checked, false);
    const last = p.calls.filter((c) => c.path === "/api/book/update").at(-1);
    assert.equal(last.body.save_card, false);
    assert.equal(last.body.plan, "package");
    assert.equal(p.confirmed.length, 1);
  });

  test("the test banner shows only in test mode, and package-only hides per visit", async () => {
    const live = page({ testMode: false, plans: ["package"] });
    await live.settle();
    assert.equal(live.els.testBanner.hidden, true);
    assert.equal(live.els.planVisitChoice.hidden, true);
    assert.equal(live.els.payVisitChoice.hidden, true);
    assert.equal(live.els.visitOffer.hidden, true);
    assert.equal(live.els.saveCard.hidden, true);
    assert.equal(live.els.saveCardChoice.hidden, true);
    assert.equal(live.els.tripFeeNote.hidden, true);
    live.els.saveCard.checked = true;
    await toPayStep(live);
    assert.equal(live.calls.find((c) => c.path === "/api/book/hold").body.save_card, false);
    const testPage = page();
    await testPage.settle();
    assert.equal(testPage.els.testBanner.hidden, false);
    assert.equal(testPage.els.planVisitChoice.hidden, false);
    assert.equal(testPage.els.saveCard.hidden, false);
    assert.equal(testPage.els.saveCardChoice.hidden, false);
    assert.equal(testPage.els.tripFeeNote.hidden, false);
  });

  test("the card form is card only: Link (its Bank and Klarna tabs) is turned off", async () => {
    const p = page();
    await toPayStep(p);
    assert.equal(p.created.length, 1);
    assert.equal(p.created[0].type, "payment");
    assert.equal(p.created[0].options?.wallets?.link, "never");
  });

  test("the confirmation shows the BK- booking reference", async () => {
    const p = page();
    await toPayStep(p);
    await p.els.payBtn.fire("click"); await p.settle();
    assert.equal(p.els.doneTitle.textContent, "You're booked");
    assert.equal(p.els.doneRef.textContent, "Booking reference: BK-0123456789abcdef");
  });

  test("a schedule outage points to the quote form and phone", async () => {
    const p = page({ slotsStatus: 503 });
    await p.settle();
    await p.els.details.fire("submit", { submitter: new El("submit") });
    await p.settle();
    assert.equal(p.els.error.hidden, false);
    assert.match(p.els.error.textContent, /couldn't check the schedule/);
    const links = p.els.error.children[0].children.filter((c) => c.tag === "a");
    assert.equal(links[0].href, "/#quote-form");
    assert.equal(links[1].href, "tel:+19548803500");
  });
});
