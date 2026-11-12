// Unit tests for test-mode card saving. Fictional customers only. No network, no live keys.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { SESSION_COOKIE, signToken } from "./lib.js";
import { onRequestGet } from "./me.js";
import {
  CONSENT_TEMPLATE,
  consentMessage,
  consentVersion,
  customerMaySaveCard,
  onConfirm,
  onRemove,
  onSetup,
} from "./card.js";
import { onRequestPost as onWebhook } from "../stripe-webhook.js";
import worker from "../worker.js";

const SECRET = "unit-test-session-secret-32chars-min";
const WEBHOOK_SECRET = "whsec_fictional_unit_test_secret";
const TEST_KEY = "rk_test_fictional_not_a_real_key";
const OLD_KEY = "sk_test_old_name_must_not_be_sent";
// Stripe's 0341 test card saves successfully. A later off-session charge is declined.
// This build never charges, and the full number is never sent to Stripe or Make.
const TEST_CARD_0341 = "4000000000000341";
const CHECKOUT_EMAIL = "typed-at-checkout@example.test";

function testEnv(overrides = {}) {
  return {
    SESSION_SECRET: SECRET,
    ACCOUNT_WEBHOOK_URL: "http://127.0.0.1/mock-crm",
    ACCOUNT_WEBHOOK_KEY: "unit-test-webhook-key",
    STRIPE_LBT_TEST_SECRET_KEY: TEST_KEY,
    STRIPE_LBT_WEBHOOK_SECRET: WEBHOOK_SECRET,
    CARD_SAVE_MODE: "test",
    ...overrides,
  };
}

function customerRow(overrides = {}) {
  return {
    Customer_ID: "LC-9001",
    First_Name: "Casey",
    Last_Name: "Nguyen",
    Phone: "555-010-0199",
    Email: "",
    Payment_Method: "Cash",
    Status: "Test",
    Price_Per_Visit: "45",
    Stripe_Customer_ID: "",
    Card_On_File: "",
    ...overrides,
  };
}

function crmSnapshot(row) {
  const headers = Object.keys(row);
  return {
    valueRanges: [
      { range: "Customers!A1:Z2", values: [headers, headers.map((h) => row[h] ?? "")] },
      { range: "Invoices!A1:A1", values: [["Invoice_ID"]] },
      { range: "Jobs!A1:A1", values: [["Job_ID"]] },
    ],
  };
}

function lawnsCustomer(id = "cus_test_lawns9001", cid = "LC-9001") {
  return {
    id,
    object: "customer",
    metadata: { business: "lawns_by_timmy", crm_customer_id: cid, source: "account_page" },
  };
}

function forkCustomer(id = "cus_test_forkother") {
  return {
    id,
    object: "customer",
    metadata: { business: "fork_algorithm", crm_customer_id: "FORK-1" },
  };
}

async function signedRequest(path, { method = "POST", body, cid = "LC-9001", phone = "5550100199", origin = "https://lawnsbytimmy.com" } = {}) {
  const token = await signToken({ p: "session", cid, phone, exp: Date.now() + 60_000 }, SECRET);
  const headers = { Cookie: `${SESSION_COOKIE}=${token}` };
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body === undefined ? {} : body);
  }
  if (origin) headers.Origin = origin;
  return new Request(`https://lawnsbytimmy.com${path}`, init);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function installFetch(handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: (init.method || "GET").toUpperCase(),
      body: init.body == null ? "" : String(init.body),
      headers: init.headers || {},
    };
    calls.push(call);
    return handler(call);
  };
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

function stripePaths(calls) {
  return calls.filter((c) => c.url.startsWith("https://api.stripe.com")).map((c) => `${c.method} ${new URL(c.url).pathname}`);
}

function makeEvents(calls) {
  return calls
    .filter((c) => c.url.startsWith("http://127.0.0.1/mock-crm"))
    .map((c) => JSON.parse(c.body));
}

function formOf(call) {
  return new URLSearchParams(call.body);
}

// Routes Stripe and the CRM webhook. `stripe(call)` returns a Response or a JSON body.
function mockBackend({ row, stripe }) {
  const snapshot = crmSnapshot(row);
  return installFetch((call) => {
    if (call.url.startsWith("http://127.0.0.1/mock-crm")) {
      const event = JSON.parse(call.body);
      if (event.event === "crm_snapshot") return jsonResponse(snapshot);
      return jsonResponse({ ok: true });
    }
    if (call.url.startsWith("https://api.stripe.com")) {
      assert.equal(call.headers.Authorization, `Bearer ${TEST_KEY}`);
      assert.equal(call.headers["Stripe-Version"], "2026-09-30.endive");
      assert.equal(call.headers.Authorization.includes(OLD_KEY), false);
      const result = stripe(call);
      return result instanceof Response ? result : jsonResponse(result.body ?? result, result.status || 200);
    }
    return jsonResponse({ error: { message: "unmocked " + call.url } }, 500);
  });
}

async function stripeSignature(secret, payload, timestamp, { extra = "" } = {}) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}${extra}`;
}

function savedCardEvent(overrides = {}) {
  return {
    id: "evt_test_fictional",
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_save9001",
        object: "checkout.session",
        mode: "setup",
        status: "complete",
        livemode: false,
        client_reference_id: "LC-9001",
        customer: "cus_test_lawns9001",
        setup_intent: "seti_test_save9001",
        customer_email: CHECKOUT_EMAIL,
        customer_details: { email: CHECKOUT_EMAIL, name: "Pat Typed" },
        metadata: {
          business: "lawns_by_timmy",
          crm_customer_id: "LC-9001",
          kind: "account_card_save",
          consent_version: "lbt-card-consent-20261112-aaaaaaaa",
        },
        ...overrides,
      },
    },
  };
}

function card0341() {
  return {
    id: "pm_test_new0341",
    object: "payment_method",
    card: { brand: "visa", last4: TEST_CARD_0341.slice(-4), exp_month: 12, exp_year: 2028 },
  };
}

describe("account card saving", { concurrency: false }, () => {
  test("consent version is the wording date plus the template hash", async () => {
    const version = await consentVersion();
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(CONSENT_TEMPLATE));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 8);
    assert.equal(version, `lbt-card-consent-20261112-${hex}`);
    const priced = consentMessage("45");
    assert.match(priced, /currently \$45\)/);
    assert.equal(priced.includes("${"), false);
    assert.equal(consentMessage("$45.00"), priced);
    const blank = consentMessage("");
    assert.equal(blank.includes("currently"), false);
    assert.match(blank, /for your visit price, or once a month/);
    assert.equal(CONSENT_TEMPLATE.includes("(954) 880-3500"), true);
  });

  test("setup session is created in setup mode and expires in 60 minutes", async () => {
    const before = Math.floor(Date.now() / 1000);
    const version = await consentVersion();
    const mock = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_lawns9001" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          return { body: { id: "cs_test_save9001", url: "https://checkout.stripe.com/c/pay/cs_test_save9001" } };
        }
        return jsonResponse({ error: { message: "unexpected " + call.method + " " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      const after = Math.floor(Date.now() / 1000);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { url: "https://checkout.stripe.com/c/pay/cs_test_save9001" });
      const created = mock.calls.find((c) => c.method === "POST" && c.url.includes("/v1/checkout/sessions"));
      const form = formOf(created);
      assert.equal(form.get("mode"), "setup");
      assert.equal(form.get("currency"), "usd");
      assert.equal(form.get("payment_method_types[0]"), "card");
      assert.equal(form.get("customer"), "cus_test_lawns9001");
      assert.equal(form.get("client_reference_id"), "LC-9001");
      assert.equal(form.get("metadata[business]"), "lawns_by_timmy");
      assert.equal(form.get("metadata[crm_customer_id]"), "LC-9001");
      assert.equal(form.get("metadata[kind]"), "account_card_save");
      assert.equal(form.get("metadata[consent_version]"), version);
      assert.equal(form.get("setup_intent_data[metadata][business]"), "lawns_by_timmy");
      assert.equal(form.get("setup_intent_data[metadata][crm_customer_id]"), "LC-9001");
      assert.equal(form.get("setup_intent_data[metadata][kind]"), "account_card_save");
      assert.equal(form.get("setup_intent_data[metadata][consent_version]"), version);
      assert.equal(form.get("setup_intent_data[description]"), "Lawns by Timmy card on file (charged after each completed visit)");
      assert.equal(form.get("custom_text[submit][message]"), consentMessage("45"));
      assert.equal(form.get("success_url"), "https://lawnsbytimmy.com/account/?card=saved&cs={CHECKOUT_SESSION_ID}");
      assert.equal(form.get("cancel_url"), "https://lawnsbytimmy.com/account/?card=cancelled");
      assert.match(created.body, /\{CHECKOUT_SESSION_ID\}/);
      assert.equal(created.body.includes("%7BCHECKOUT_SESSION_ID%7D"), false);
      assert.match(form.get("integration_identifier"), /^lbtcard[a-z]{8}$/);
      const expires = Number(form.get("expires_at"));
      assert.ok(expires >= before + 30 * 60);
      assert.ok(expires >= before + 60 * 60);
      assert.ok(expires <= after + 60 * 60);
      assert.equal(stripePaths(mock.calls).some((p) => p.includes("payment_intents")), false);
      assert.equal(makeEvents(mock.calls).some((e) => e.event === "card_saved"), false);
    } finally {
      mock.restore();
    }
  });

  test("reuses the CRM Stripe customer before search or create", async () => {
    const mock = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_lawns9001" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          return { body: { url: "https://checkout.stripe.com/c/pay/cs_test_reused" } };
        }
        return jsonResponse({ error: { message: "unexpected " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(res.status, 200);
      const paths = stripePaths(mock.calls);
      assert.deepEqual(paths, ["GET /v1/customers/cus_test_lawns9001", "POST /v1/checkout/sessions"]);
    } finally {
      mock.restore();
    }
  });

  test("searches by lawns metadata before creating a customer", async () => {
    const mock = mockBackend({
      row: customerRow(),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/search") {
          const query = url.searchParams.get("query");
          assert.match(query, /metadata\['business'\]:'lawns_by_timmy'/);
          assert.match(query, /metadata\['crm_customer_id'\]:'LC-9001'/);
          return { body: { data: [lawnsCustomer()] } };
        }
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          assert.equal(formOf(call).get("customer"), "cus_test_lawns9001");
          return { body: { url: "https://checkout.stripe.com/c/pay/cs_test_found" } };
        }
        return jsonResponse({ error: { message: "unexpected " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(res.status, 200);
      assert.deepEqual(stripePaths(mock.calls), ["GET /v1/customers/search", "POST /v1/checkout/sessions"]);
    } finally {
      mock.restore();
    }
  });

  test("creates a customer with an idempotency key when none exists, and omits a blank email", async () => {
    const mock = mockBackend({
      row: customerRow({ Email: "" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/search") return { body: { data: [] } };
        if (call.method === "POST" && url.pathname === "/v1/customers") {
          const form = formOf(call);
          assert.equal(call.headers["Idempotency-Key"], "lbt-cust-LC-9001");
          assert.equal(form.get("name"), "Casey Nguyen");
          assert.equal(form.get("phone"), "+15550100199");
          assert.equal(form.get("email"), null);
          assert.equal(form.get("metadata[business]"), "lawns_by_timmy");
          assert.equal(form.get("metadata[crm_customer_id]"), "LC-9001");
          assert.equal(form.get("metadata[source]"), "account_page");
          return { body: lawnsCustomer("cus_test_created9001") };
        }
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          assert.equal(formOf(call).get("customer"), "cus_test_created9001");
          return { body: { url: "https://checkout.stripe.com/c/pay/cs_test_created" } };
        }
        return jsonResponse({ error: { message: "unexpected " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(res.status, 200);
      assert.equal(makeEvents(mock.calls).some((e) => String(e.email || "") !== "" || /example\.test/.test(cJson(e))), false);
    } finally {
      mock.restore();
    }
  });

  test("does not reuse a customer tagged for another business", async () => {
    const mock = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_forkother" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_forkother") return forkCustomer();
        if (call.method === "GET" && url.pathname === "/v1/customers/search") return { body: { data: [lawnsCustomer()] } };
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          assert.equal(formOf(call).get("customer"), "cus_test_lawns9001");
          return { body: { url: "https://checkout.stripe.com/c/pay/cs_test_separated" } };
        }
        return jsonResponse({ error: { message: "unexpected " + call.method + " " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(res.status, 200);
      const paths = stripePaths(mock.calls);
      assert.deepEqual(paths, [
        "GET /v1/customers/cus_test_forkother",
        "GET /v1/customers/search",
        "POST /v1/checkout/sessions",
      ]);
      assert.equal(paths.some((p) => p.startsWith("DELETE")), false);
    } finally {
      mock.restore();
    }
  });

  test("test mode allows a card only when Status contains Test", async () => {
    assert.equal(customerMaySaveCard(customerRow({ Status: "Test" })), true);
    assert.equal(customerMaySaveCard(customerRow({ Status: "TEST customer" })), true);
    assert.equal(customerMaySaveCard(customerRow({ Status: "Active" })), false);
    assert.equal(customerMaySaveCard(customerRow({ Status: "Test", Payment_Method: "Trade (storage space)" })), false);

    const blocked = mockBackend({
      row: customerRow({ Status: "Active" }),
      stripe() {
        return jsonResponse({ error: { message: "stripe should not be called" } }, 500);
      },
    });
    try {
      const setup = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(setup.status, 404);
      assert.equal(stripePaths(blocked.calls).length, 0);
      const me = await onRequestGet({
        request: await signedRequest("/api/account/me", { method: "GET" }),
        env: testEnv(),
      });
      assert.equal((await me.json()).card_save_enabled, false);
    } finally {
      blocked.restore();
    }

    const allowed = mockBackend({
      row: customerRow({ Status: "pre-TEST", Stripe_Customer_ID: "cus_test_lawns9001" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          return { body: { url: "https://checkout.stripe.com/c/pay/cs_test_status" } };
        }
        return jsonResponse({ error: { message: "unexpected " + url.pathname } }, 500);
      },
    });
    try {
      const setup = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(setup.status, 200);
      const me = await onRequestGet({
        request: await signedRequest("/api/account/me", { method: "GET" }),
        env: testEnv(),
      });
      assert.equal((await me.json()).card_save_enabled, true);
    } finally {
      allowed.restore();
    }
  });

  test("a payment method that contains trade hides the button and refuses setup", async () => {
    const row = customerRow({ Payment_Method: "Trade (storage space)" });
    const mock = mockBackend({
      row,
      stripe() {
        return jsonResponse({ error: { message: "stripe should not be called" } }, 500);
      },
    });
    try {
      const setup = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(setup.status, 404);
      assert.equal(stripePaths(mock.calls).length, 0);
      const me = await onRequestGet({
        request: await signedRequest("/api/account/me", { method: "GET", body: undefined }),
        env: testEnv(),
      });
      const data = await me.json();
      assert.equal(data.card_save_enabled, false);
      assert.equal(data.consent_text, "");
    } finally {
      mock.restore();
    }
  });

  test("GET /api/account/me reports the saved card only when test mode is on", async () => {
    const row = customerRow({
      Card_On_File: "Yes: Visa 0341 exp 12/28 (saved 11/12/2026)",
      Price_Per_Visit: "55",
    });
    const mock = mockBackend({ row, stripe() { throw new Error("no stripe on me"); } });
    try {
      const on = await onRequestGet({
        request: await signedRequest("/api/account/me", { method: "GET", body: undefined }),
        env: testEnv(),
      });
      const data = await on.json();
      assert.equal(data.card_save_enabled, true);
      assert.deepEqual(data.card, { saved: true, label: "Visa •••• 0341" });
      assert.match(data.consent_text, /currently \$55/);
      assert.equal(data.consent_text.includes(CHECKOUT_EMAIL), false);

      const off = await onRequestGet({
        request: await signedRequest("/api/account/me", { method: "GET", body: undefined }),
        env: testEnv({ CARD_SAVE_MODE: "off", STRIPE_LBT_TEST_SECRET_KEY: "", STRIPE_LBT_WEBHOOK_SECRET: "" }),
      });
      const hidden = await off.json();
      assert.equal(hidden.card_save_enabled, false);
      assert.equal(hidden.consent_text, "");
      assert.equal(stripePaths(mock.calls).length, 0);
    } finally {
      mock.restore();
    }
  });

  test("the feature is off unless the test secrets and CARD_SAVE_MODE=test are set", async () => {
    const cases = [
      { CARD_SAVE_MODE: "off" },
      { CARD_SAVE_MODE: "live" },
      { CARD_SAVE_MODE: "" },
      { STRIPE_LBT_TEST_SECRET_KEY: "" },
      { STRIPE_LBT_WEBHOOK_SECRET: "" },
      { STRIPE_LBT_TEST_SECRET_KEY: undefined, STRIPE_SECRET_KEY: OLD_KEY },
      { STRIPE_LBT_TEST_SECRET_KEY: "sk_live_fictional_refused", STRIPE_LBT_WEBHOOK_SECRET: WEBHOOK_SECRET },
      { STRIPE_LBT_TEST_SECRET_KEY: "rk_live_fictional_refused", STRIPE_LBT_WEBHOOK_SECRET: WEBHOOK_SECRET },
    ];
    for (const overrides of cases) {
      const mock = installFetch(() => {
        throw new Error("fetch should not run while card saving is off");
      });
      try {
        const env = testEnv(overrides);
        if (Object.prototype.hasOwnProperty.call(overrides, "STRIPE_LBT_TEST_SECRET_KEY") && overrides.STRIPE_LBT_TEST_SECRET_KEY === undefined) {
          delete env.STRIPE_LBT_TEST_SECRET_KEY;
        }
        const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env });
        assert.equal(res.status, 404, JSON.stringify(overrides));
        assert.equal(mock.calls.length, 0);
        const hook = await onWebhook({
          request: new Request("https://lawnsbytimmy.com/api/stripe/lbt-webhook", { method: "POST", body: "{}" }),
          env,
        });
        assert.equal(hook.status, 404, JSON.stringify(overrides));
      } finally {
        mock.restore();
      }
    }
  });

  test("a signed webhook for test card 4000000000000341 saves it, replaces the old card, and does not charge", async () => {
    assert.equal(TEST_CARD_0341.slice(-4), "0341");
    const event = savedCardEvent();
    const payload = JSON.stringify(event);
    const header = await stripeSignature(WEBHOOK_SECRET, payload, Math.floor(Date.now() / 1000), {
      extra: ",v0=ignored,secret=whsec_not_the_real_secret,destination=we_fictional,payload=abc123",
    });
    const mock = mockBackend({
      row: customerRow(),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/setup_intents/seti_test_save9001") {
          return {
            body: {
              id: "seti_test_save9001",
              status: "succeeded",
              payment_method: card0341(),
              metadata: event.data.object.metadata,
            },
          };
        }
        if (call.method === "POST" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001/payment_methods") {
          return {
            body: {
              data: [
                { id: "pm_test_old4242", card: { brand: "visa", last4: "4242", exp_month: 1, exp_year: 2027 } },
                card0341(),
              ],
              has_more: false,
            },
          };
        }
        if (call.method === "POST" && url.pathname === "/v1/payment_methods/pm_test_old4242/detach") {
          return { body: { id: "pm_test_old4242" } };
        }
        return jsonResponse({ error: { message: "unexpected " + call.method + " " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onWebhook({
        request: new Request("https://lawnsbytimmy.com/api/stripe/lbt-webhook", {
          method: "POST",
          headers: { "Stripe-Signature": header },
          body: payload,
        }),
        env: testEnv({ STRIPE_SECRET_KEY: OLD_KEY }),
      });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { received: true });
      const detaches = mock.calls.filter((c) => c.url.includes("/detach"));
      assert.deepEqual(detaches.map((c) => new URL(c.url).pathname), ["/v1/payment_methods/pm_test_old4242/detach"]);
      const update = mock.calls.find((c) => c.method === "POST" && new URL(c.url).pathname === "/v1/customers/cus_test_lawns9001");
      assert.equal(formOf(update).get("invoice_settings[default_payment_method]"), "pm_test_new0341");
      assert.equal(formOf(update).get("email"), null);
      const saved = makeEvents(mock.calls).find((e) => e.event === "card_saved");
      assert.ok(saved);
      assert.match(saved.card_label, /^Yes: Visa 0341 exp 12\/28 \(saved \d{2}\/\d{2}\/\d{4}\)$/);
      assert.equal(saved.customer_id, "LC-9001");
      assert.equal(saved.stripe_customer_id, "cus_test_lawns9001");
      assert.equal(saved.consent_version, "lbt-card-consent-20261112-aaaaaaaa");
      assert.equal(Object.hasOwn(saved, "email"), false);
      assert.equal(Object.hasOwn(saved, "customer_email"), false);
      assert.equal(JSON.stringify(saved).includes(CHECKOUT_EMAIL), false);
      assert.equal(JSON.stringify(saved).includes(TEST_CARD_0341), false);
      assert.equal(JSON.stringify(mock.calls).includes(TEST_CARD_0341), false);
      assert.equal(mock.calls.some((c) => c.url.includes("/payment_intents")), false);
      assert.equal(mock.calls.some((c) => c.method === "DELETE"), false);
      assert.equal(mock.calls.some((c) => c.headers.Authorization === `Bearer ${OLD_KEY}`), false);
    } finally {
      mock.restore();
    }
  });

  test("a failed detach keeps the new default and tells Make the old card is still attached", async () => {
    const payload = JSON.stringify(savedCardEvent());
    const header = await stripeSignature(WEBHOOK_SECRET, payload, Math.floor(Date.now() / 1000));
    const mock = mockBackend({
      row: customerRow(),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/setup_intents/seti_test_save9001") {
          return { body: { id: "seti_test_save9001", status: "succeeded", payment_method: card0341() } };
        }
        if (call.method === "POST" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001/payment_methods") {
          return { body: { data: [{ id: "pm_test_old4242" }, card0341()], has_more: false } };
        }
        if (call.method === "POST" && url.pathname.endsWith("/detach")) {
          return jsonResponse({ error: { message: "detach failed" } }, 500);
        }
        return jsonResponse({ error: { message: "unexpected" } }, 500);
      },
    });
    try {
      const res = await onWebhook({
        request: new Request("https://lawnsbytimmy.com/api/stripe/lbt-webhook", {
          method: "POST",
          headers: { "Stripe-Signature": header },
          body: payload,
        }),
        env: testEnv(),
      });
      assert.equal(res.status, 200);
      const saved = makeEvents(mock.calls).find((e) => e.event === "card_saved");
      assert.equal(saved.old_card_still_attached, true);
      assert.match(saved.card_label, /0341/);
      const detaches = mock.calls.filter((c) => c.url.includes("/detach"));
      assert.equal(detaches.length, 1);
      assert.equal(detaches[0].url.includes("pm_test_new0341"), false);
    } finally {
      mock.restore();
    }
  });

  test("webhook signature: bad, stale, and other businesses are not recorded", async () => {
    const now = Math.floor(Date.now() / 1000);
    const cases = [
      {
        name: "bad signature",
        event: savedCardEvent(),
        header: `t=${now},v1=${"ab".repeat(32)}`,
        status: 400,
      },
      {
        name: "stale signature",
        event: savedCardEvent(),
        header: await stripeSignature(WEBHOOK_SECRET, JSON.stringify(savedCardEvent()), now - 301),
        status: 400,
        raw: JSON.stringify(savedCardEvent()),
      },
      {
        name: "fork business",
        event: savedCardEvent({ metadata: { business: "fork_algorithm", crm_customer_id: "LC-9001", kind: "account_card_save", consent_version: "x" } }),
        status: 200,
        ignored: true,
      },
      {
        name: "missing business",
        event: savedCardEvent({ metadata: { kind: "account_card_save" } }),
        status: 200,
        ignored: true,
      },
      {
        name: "payment mode",
        event: savedCardEvent({ mode: "payment" }),
        status: 200,
        ignored: true,
      },
      {
        name: "other event type",
        event: { id: "evt_test_other", object: "event", type: "invoice.paid", livemode: false, data: { object: {} } },
        status: 200,
        ignored: true,
      },
      {
        name: "live mode event",
        event: { ...savedCardEvent(), livemode: true },
        status: 200,
        ignored: true,
      },
    ];
    for (const item of cases) {
      const payload = item.raw || JSON.stringify(item.event);
      const header = item.header || await stripeSignature(WEBHOOK_SECRET, payload, now);
      const mock = installFetch(() => {
        throw new Error(`${item.name} should not call fetch`);
      });
      try {
        const res = await onWebhook({
          request: new Request("https://lawnsbytimmy.com/api/stripe/lbt-webhook", {
            method: "POST",
            headers: { "Stripe-Signature": header },
            body: payload,
          }),
          env: testEnv(),
        });
        assert.equal(res.status, item.status, item.name);
        if (item.ignored) assert.deepEqual(await res.json(), { received: true, ignored: true });
        assert.equal(mock.calls.length, 0, item.name);
      } finally {
        mock.restore();
      }
    }
  });

  test("confirm rejects a checkout session for a different customer", async () => {
    const mock = mockBackend({
      row: customerRow(),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/checkout/sessions/cs_test_other") {
          return {
            body: {
              id: "cs_test_other",
              mode: "setup",
              status: "complete",
              livemode: false,
              client_reference_id: "LC-9002",
              customer: "cus_test_someoneelse",
              metadata: { business: "lawns_by_timmy", crm_customer_id: "LC-9002" },
            },
          };
        }
        return jsonResponse({ error: { message: "unexpected " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onConfirm({
        request: await signedRequest("/api/account/card/confirm", { body: { cs: "cs_test_other" } }),
        env: testEnv(),
      });
      assert.equal(res.status, 403);
      assert.equal(makeEvents(mock.calls).some((e) => e.event === "card_saved"), false);
      assert.equal(mock.calls.some((c) => c.url.includes("/detach")), false);
    } finally {
      mock.restore();
    }
  });

  test("confirm records the card as a backup when the signed-in customer matches", async () => {
    const mock = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_lawns9001" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/checkout/sessions/cs_test_save9001") {
          return { body: savedCardEvent().data.object };
        }
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/setup_intents/seti_test_save9001") {
          return { body: { id: "seti_test_save9001", status: "succeeded", payment_method: card0341() } };
        }
        if (call.method === "POST" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001/payment_methods") {
          return { body: { data: [card0341()], has_more: false } };
        }
        return jsonResponse({ error: { message: "unexpected " + call.method + " " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onConfirm({
        request: await signedRequest("/api/account/card/confirm", { body: { cs: "cs_test_save9001" } }),
        env: testEnv(),
      });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true });
      const saved = makeEvents(mock.calls).find((e) => e.event === "card_saved");
      assert.match(saved.card_label, /Visa 0341/);
      assert.equal(JSON.stringify(saved).includes(CHECKOUT_EMAIL), false);
      assert.equal(mock.calls.some((c) => c.url.includes("/detach")), false);
      assert.equal(mock.calls.some((c) => c.url.includes("/payment_intents")), false);
    } finally {
      mock.restore();
    }
  });

  test("remove detaches every card and sends card_removed", async () => {
    const mock = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_lawns9001" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001/payment_methods") {
          return {
            body: {
              data: [
                { id: "pm_test_old4242" },
                { id: "pm_test_new0341" },
              ],
              has_more: false,
            },
          };
        }
        if (call.method === "POST" && /\/v1\/payment_methods\/pm_test_(old4242|new0341)\/detach$/.test(url.pathname)) {
          return { body: { id: url.pathname.split("/")[3] } };
        }
        return jsonResponse({ error: { message: "unexpected " + call.method + " " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onRemove({ request: await signedRequest("/api/account/card/remove"), env: testEnv() });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true });
      const detaches = mock.calls.filter((c) => c.url.includes("/detach")).map((c) => new URL(c.url).pathname).sort();
      assert.deepEqual(detaches, [
        "/v1/payment_methods/pm_test_new0341/detach",
        "/v1/payment_methods/pm_test_old4242/detach",
      ]);
      const removed = makeEvents(mock.calls).find((e) => e.event === "card_removed");
      assert.equal(removed.customer_id, "LC-9001");
      assert.equal(removed.key, "unit-test-webhook-key");
      assert.match(removed.removed_at, /^\d{4}-\d{2}-\d{2}T/);
      assert.deepEqual(Object.keys(removed).sort(), ["customer_id", "event", "key", "removed_at", "timestamp"]);
      assert.equal(JSON.stringify(removed).includes(CHECKOUT_EMAIL), false);
      assert.equal(mock.calls.some((c) => c.method === "DELETE"), false);
      assert.equal(mock.calls.some((c) => c.url.includes("/payment_intents")), false);
    } finally {
      mock.restore();
    }
  });

  test("remove still succeeds when the customer has no cards, and does not detach another business", async () => {
    const empty = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_lawns9001" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_lawns9001") return lawnsCustomer();
        if (call.method === "GET" && url.pathname.endsWith("/payment_methods")) return { body: { data: [], has_more: false } };
        return jsonResponse({ error: { message: "unexpected " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onRemove({ request: await signedRequest("/api/account/card/remove"), env: testEnv() });
      assert.equal(res.status, 200);
      assert.equal(makeEvents(empty.calls).some((e) => e.event === "card_removed"), true);
      assert.equal(empty.calls.some((c) => c.url.includes("/detach")), false);
    } finally {
      empty.restore();
    }

    const other = mockBackend({
      row: customerRow({ Stripe_Customer_ID: "cus_test_forkother" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/cus_test_forkother") return forkCustomer();
        if (call.method === "GET" && url.pathname === "/v1/customers/search") return { body: { data: [] } };
        return jsonResponse({ error: { message: "unexpected " + call.method + " " + url.pathname } }, 500);
      },
    });
    try {
      const res = await onRemove({ request: await signedRequest("/api/account/card/remove"), env: testEnv() });
      assert.equal(res.status, 200);
      assert.equal(other.calls.some((c) => c.url.includes("/detach")), false);
      assert.equal(other.calls.some((c) => c.method === "DELETE"), false);
      assert.equal(makeEvents(other.calls).some((e) => e.event === "card_removed"), true);
    } finally {
      other.restore();
    }
  });

  test("a CRM email can be stored on the Stripe customer and is never posted to Make", async () => {
    const mock = mockBackend({
      row: customerRow({ Email: "casey@example.test" }),
      stripe(call) {
        const url = new URL(call.url);
        if (call.method === "GET" && url.pathname === "/v1/customers/search") return { body: { data: [] } };
        if (call.method === "POST" && url.pathname === "/v1/customers") {
          assert.equal(formOf(call).get("email"), "casey@example.test");
          return { body: lawnsCustomer("cus_test_created9001") };
        }
        if (call.method === "POST" && url.pathname === "/v1/checkout/sessions") {
          return { body: { url: "https://checkout.stripe.com/c/pay/cs_test_email" } };
        }
        return jsonResponse({ error: { message: "unexpected" } }, 500);
      },
    });
    try {
      const res = await onSetup({ request: await signedRequest("/api/account/card/setup"), env: testEnv() });
      assert.equal(res.status, 200);
      const posted = JSON.stringify(makeEvents(mock.calls));
      assert.equal(posted.includes("casey@example.test"), false);
      assert.equal(posted.includes(CHECKOUT_EMAIL), false);
    } finally {
      mock.restore();
    }
  });

  test("worker routes stay dark until test mode is on", async () => {
    const off = await worker.fetch(new Request("https://lawnsbytimmy.com/api/account/card/setup", {
      method: "POST",
      body: "{}",
    }), { SESSION_SECRET: SECRET });
    assert.equal(off.status, 404);

    const on = await worker.fetch(new Request("https://lawnsbytimmy.com/api/account/card/setup", {
      method: "POST",
      headers: { Origin: "https://lawnsbytimmy.com" },
      body: "{}",
    }), testEnv());
    assert.equal(on.status, 401);

    const hook = await worker.fetch(new Request("https://lawnsbytimmy.com/api/stripe/lbt-webhook", {
      method: "POST",
      body: "{}",
    }), testEnv());
    assert.equal(hook.status, 400);
  });

  test("the account page keeps the visit payment line and the card actions", () => {
    const html = readFileSync(new URL("../../account/index.html", import.meta.url), "utf8");
    assert.match(html, /Payment is due when the visit is done\./);
    assert.match(html, /Save a card/);
    assert.match(html, /Replace card/);
    assert.match(html, /Remove card/);
    assert.match(html, /Card saved\. Thank you!/);
    assert.match(html, /Remove your card\? Timmy won't be able to charge it after visits\. You can pay by cash, Zelle or Apple Pay instead\./);
    assert.match(html, /card_save_enabled/);
    assert.equal(html.includes("hook.us2.make.com"), false);
    assert.equal(html.includes("sk_live_"), false);
    assert.equal(html.includes("sk_test_"), false);
    assert.equal(html.includes("rk_test_"), false);
    assert.equal(html.includes(TEST_CARD_0341), false);
  });

  test("card saving code does not read the old Stripe secret name", () => {
    const files = ["card.js", "me.js", "../worker.js", "../stripe-webhook.js"];
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      assert.equal(source.includes("STRIPE_SECRET_KEY"), false, file);
    }
  });
});

function cJson(value) {
  return JSON.stringify(value);
}
