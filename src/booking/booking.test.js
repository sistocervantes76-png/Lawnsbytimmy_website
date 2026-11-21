// Unit tests for the test-only booking flow. Fictional customers. No network.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { stripe } from "../account/card.js";
import { MemoryLedger, SlotBook, bookingPaidPayload } from "./book.js";
import {
  addDaysIso,
  bookingConfig,
  etIsoDate,
  isServiceDay,
  newCustomerId,
  quotePrice,
  weekdayIndex,
  ZONE2_ZIPS,
} from "./config.js";
import { forwardBookingPaid } from "./confirm.js";
import { bookingMode } from "./guard.js";
import { onConfig, onHold, onQuote, onSlots, onUpdate } from "./handlers.js";
import { parseAvailability } from "./slots.js";
import { onRequestPost as onBookingWebhook } from "./webhook.js";
import worker from "../worker.js";

const NOW = Date.parse("2026-11-18T20:00:00.000Z");
const TEST_KEY = "rk_test_fictional_not_a_real_key";
const PUBLISHABLE = "pk_test_fictional_not_a_real_key";
const WEBHOOK_SECRET = "whsec_fictional_unit_test_secret";
const HOOK = "http://127.0.0.1/mock-booking";
const HOOK_KEY = "unit-test-booking-key";

function customer(overrides = {}) {
  return {
    first_name: "Test",
    last_name: "Booker",
    email: "booker@example.test",
    phone: "9545550123",
    address: "1 Test St",
    city: "Oakland Park",
    zip: "33334",
    sms_consent: false,
    ...overrides,
  };
}

function holdInput(id, slot, overrides = {}) {
  return {
    bookingId: id,
    customerId: "LC-26111815000001",
    date: slot.date,
    windowId: slot.windowId,
    plan: "package",
    zone: 1,
    amountCents: 15400,
    pricePerVisit: 45,
    zip: "33334",
    saveCard: true,
    customer: customer(),
    ...overrides,
  };
}

function firstSlot(listed, windowId) {
  for (const day of listed.days) {
    const window = windowId ? day.windows.find((item) => item.id === windowId) : day.windows[0];
    if (window) return { date: day.date, windowId: window.id, window };
  }
  return null;
}

function sheet(rows) {
  const header = ["Job_ID", "Service_Date", "Crew", "Type", "Price", "Note", "Job_Status", "Job_Notes"];
  return { valueRanges: [{ range: "TEST_Jobs!A1:H10", values: [header, ...rows] }] };
}

function testEnv(overrides = {}) {
  const { SLOT_LEDGER_TEST, ...rest } = overrides;
  const env = {
    BOOKING_MODE: "test",
    STRIPE_LBT_TEST_SECRET_KEY: TEST_KEY,
    STRIPE_LBT_TEST_PUBLISHABLE_KEY: PUBLISHABLE,
    STRIPE_BOOKING_WEBHOOK_SECRET: WEBHOOK_SECRET,
    BOOKING_WEBHOOK_URL: HOOK,
    BOOKING_WEBHOOK_KEY: HOOK_KEY,
    ...rest,
  };
  env.SLOT_LEDGER_TEST = SLOT_LEDGER_TEST === undefined ? new MemoryLedger(env) : SLOT_LEDGER_TEST;
  return env;
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
  return { calls, restore() { globalThis.fetch = original; } };
}

async function stripeSignature(secret, payload, timestamp) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

describe("pricing and customer ids", () => {
  test("ZIP price is chosen on the server, and zone 3 or a big yard is not charged", () => {
    assert.deepEqual(quotePrice({ zip: "33309", plan: "per_visit", yard: "yes" }).amountCents, 4500);
    assert.equal(quotePrice({ zip: "33334", plan: "package", yard: "yes" }).amountCents, 15400);
    for (const zip of ZONE2_ZIPS) {
      const visit = quotePrice({ zip, plan: "per_visit", yard: "yes" });
      const packaged = quotePrice({ zip, plan: "package", yard: "yes" });
      assert.equal(visit.zone, 2);
      assert.equal(visit.amountCents, 5500);
      assert.equal(visit.pricePerVisit, 55);
      assert.equal(packaged.amountCents, 15400);
      assert.equal(packaged.pricePerVisit, 55);
    }
    assert.equal(quotePrice({ zip: "33101", plan: "per_visit", yard: "yes" }).payable, false);
    assert.equal(quotePrice({ zip: "33309", plan: "package", yard: "no" }).reason, "yard");
    assert.equal(quotePrice({ zip: "abc", plan: "package", yard: "yes" }).zone, 3);
  });

  test("a new booking id is LC- plus digits, including a fixed Eastern Time stamp", () => {
    assert.equal(newCustomerId(NOW, () => 7), "LC-26111815000007");
    assert.match(newCustomerId(), /^LC-\d{14}$/);
  });
});

describe("slots", () => {
  test("Tue-Sat, 2 to 21 days ahead, and a full later visit hides the first", async () => {
    const ledger = new MemoryLedger({}, { now: () => NOW });
    const today = etIsoDate(NOW);
    assert.equal(today, "2026-11-18");
    await ledger.putSnapshot(parseAvailability(sheet([
      ["JOB-A", "12/29/2026", "", "", "", "", "Scheduled", "Window 8\u201310 AM"],
      ["JOB-B", "12/29/2026", "", "", "", "", "Scheduled", "Window 8-10 AM"],
      ["JOB-C", "12/29/2026", "", "", "", "", "Completed", "Window 8\u201310 AM"],
    ]), bookingConfig({}).windows));
    const listed = await ledger.list();
    const dates = listed.days.map((day) => day.date);
    assert.ok(dates.length > 0);
    assert.ok(dates.every((date) => isServiceDay(date)));
    assert.ok(dates.every((date) => weekdayIndex(date) >= 2 && weekdayIndex(date) <= 6));
    assert.ok(dates.every((date) => date >= addDaysIso(today, 2) && date <= addDaysIso(today, 21)));
    assert.equal(dates.includes(addDaysIso(today, 1)), false);
    const december = listed.days.find((day) => day.date === "2026-12-01");
    assert.ok(december);
    assert.equal(december.windows.some((window) => window.id === "0800-1000"), false);
    assert.equal(december.windows.some((window) => window.id === "1000-1200"), true);
  });

  test("all-day and LBT Block close seats; other events and a missing calendar do not", async () => {
    const parsed = parseAvailability({
      ...sheet([]),
      calendar: "not_configured",
    }, bookingConfig({}).windows);
    assert.deepEqual(parsed.blocks, []);
    assert.equal(parsed.jobs.length, 0);
    assert.throws(() => parseAvailability("Accepted", bookingConfig({}).windows));
    assert.throws(() => parseAvailability({ valueRanges: [{ range: "Customers!A1:B1", values: [["A"]] }] }, bookingConfig({}).windows));

    const ledger = new MemoryLedger({}, { now: () => NOW });
    await ledger.putSnapshot({
      jobs: [],
      blocks: [
        { date: "2026-12-03", title: "Out", all_day: true },
        { date: "2026-12-04", title: "LBT Block morning", all_day: false, start_time: "08:00", end_time: "10:00" },
        { date: "2026-12-05", title: "Filming", all_day: false, start_time: "08:00", end_time: "10:00" },
      ],
    });
    const listed = await ledger.list();
    assert.equal(listed.days.some((day) => day.date === "2026-12-03"), false);
    const friday = listed.days.find((day) => day.date === "2026-12-04");
    const saturday = listed.days.find((day) => day.date === "2026-12-05");
    assert.deepEqual(friday.windows.map((window) => window.id), ["1000-1200"]);
    assert.equal(saturday.windows.some((window) => window.id === "0800-1000"), true);
  });

  test("jobs with no window are spread across the day's windows", async () => {
    const ledger = new MemoryLedger({}, { now: () => NOW });
    await ledger.putSnapshot({
      jobs: [
        { job_id: "a", service_date: "2026-12-01", status: "Scheduled", window: "" },
        { job_id: "b", service_date: "2026-12-01", status: "Scheduled", window: "" },
        { job_id: "c", service_date: "2026-12-01", status: "Scheduled", window: "" },
      ],
      blocks: [],
    });
    const listed = await ledger.list();
    const day = listed.days.find((item) => item.date === "2026-12-01");
    assert.equal(day.windows.some((window) => window.id === "0800-1000"), false);
    const afternoon = day.windows.find((window) => window.id === "1000-1200");
    assert.equal(afternoon.open, 1);
  });

  test("a sheet row can arrive as an object and still uses columns B and G", () => {
    const parsed = parseAvailability({
      valueRanges: [{
        range: "TEST_Jobs!A1:H2",
        values: [
          ["Job_ID", "Service_Date", "C", "D", "E", "F", "Job_Status", "Job_Notes"],
          { 0: "JOB-9", 1: "12/15/2026", 6: "Scheduled", 7: "Window 10 AM-12 PM" },
        ],
      }],
    }, bookingConfig({}).windows);
    assert.equal(parsed.jobs.length, 1);
    assert.equal(parsed.jobs[0].service_date, "2026-12-15");
    assert.equal(parsed.jobs[0].window, "1000-1200");
    assert.equal(parsed.jobs[0].service_date.split("-")[1], "12");
  });

  test("windows come from config", async () => {
    const env = testEnv({
      BOOKING_CONFIG_JSON: JSON.stringify({
        windows: [{ id: "1300-1500", label: "1\u20133 PM", start: "13:00", end: "15:00" }],
        capPerWindow: 1,
      }),
    });
    const mock = installFetch(() => new Response(JSON.stringify(sheet([])), { status: 200 }));
    try {
      const config = await (await onConfig({ env })).json();
      assert.deepEqual(config.windows, [{ id: "1300-1500", label: "1\u20133 PM" }]);
      assert.equal(config.cap_per_window, 1);
      const slots = await (await onSlots({
        request: new Request("https://book.test/api/book/slots?zip=33309"),
        env,
      })).json();
      assert.equal(slots.days[0].windows[0].id, "1300-1500");
      assert.equal(slots.days[0].windows[0].open, 1);
    } finally {
      mock.restore();
    }
  });
});

describe("holds", () => {
  test("two holds at once: only one gets the last seat", async () => {
    const env = { BOOKING_CONFIG_JSON: JSON.stringify({ capPerWindow: 1 }) };
    const ledger = new MemoryLedger(env, { now: () => NOW });
    const slot = firstSlot(await ledger.list());
    const config = bookingConfig(env);
    const shared = { holds: {}, events: {}, snapshot: { jobs: [], blocks: [], fetchedAt: 0 } };
    const naive = await Promise.all(["BK-aaaaaaaaaaaaaaaa", "BK-bbbbbbbbbbbbbbbb"].map(async (id) => {
      const input = holdInput(id, slot);
      const book = new SlotBook(structuredClone(shared), config);
      const open = book.listSlots(NOW).days.some((day) => day.date === input.date && day.windows.some((window) => window.id === input.windowId));
      await Promise.resolve();
      if (!open) return { ok: false };
      shared.holds[id] = { status: "held" };
      return { ok: true };
    }));
    assert.equal(naive.filter((result) => result.ok).length, 2);

    const [first, second] = await Promise.all([
      ledger.hold(holdInput("BK-aaaaaaaaaaaaaaaa", slot)),
      ledger.hold(holdInput("BK-bbbbbbbbbbbbbbbb", slot)),
    ]);
    assert.equal([first, second].filter((result) => result.ok).length, 1);
    assert.equal([first, second].some((result) => result.reason === "taken"), true);
  });

  test("a hold expires after 15 minutes, and a late pay over a full window is flagged", async () => {
    let now = NOW;
    const ledger = new MemoryLedger(
      { BOOKING_CONFIG_JSON: JSON.stringify({ capPerWindow: 1 }) },
      { now: () => now },
    );
    const slot = firstSlot(await ledger.list());
    const first = await ledger.hold(holdInput("BK-aaaaaaaaaaaaaaaa", slot));
    assert.equal(first.ok, true);
    now = NOW + 16 * 60 * 1000;
    const reopened = await ledger.list();
    const again = reopened.days.find((day) => day.date === slot.date);
    assert.equal(again.windows.some((window) => window.id === slot.windowId), true);
    const second = await ledger.hold(holdInput("BK-bbbbbbbbbbbbbbbb", slot, { customerId: "LC-26111815000002" }));
    assert.equal(second.ok, true);
    await ledger.attachPayment("BK-bbbbbbbbbbbbbbbb", { paymentIntentId: "pi_test_second", stripeCustomerId: "cus_test_second" });
    await ledger.prepareConfirm({ bookingId: "BK-bbbbbbbbbbbbbbbb", card: { last4: "4242", brand: "visa", saved: true }, eventId: "evt_second" });
    const late = await ledger.prepareConfirm({
      bookingId: "BK-aaaaaaaaaaaaaaaa",
      card: { last4: "0341", brand: "visa", saved: false },
      eventId: "evt_late",
    });
    assert.equal(late.send, true);
    assert.equal(late.booking.needsReschedule, true);
    assert.equal(late.booking.status, "confirmed");
  });
});

describe("booking_paid contract", () => {
  test("the payload matches the test scenario and a non-ok reply fails", async () => {
    const ledger = new MemoryLedger({}, { now: () => NOW });
    const listed = await ledger.list();
    const day = listed.days.find((item) => item.date === "2026-12-01");
    const window = day.windows.find((item) => item.id === "1000-1200");
    const held = await ledger.hold(holdInput("BK-cccccccccccccccc", {
      date: "2026-12-01",
      windowId: window.id,
    }, { customerId: "LC-26111815000042", saveCard: true }));
    assert.equal(held.ok, true);
    await ledger.attachPayment("BK-cccccccccccccccc", {
      paymentIntentId: "pi_test_shape4242",
      stripeCustomerId: "cus_test_shape4242",
    });
    const prepared = await ledger.prepareConfirm({
      bookingId: "BK-cccccccccccccccc",
      card: { last4: "4242", brand: "visa", saved: true },
      eventId: "evt_shape",
    });
    const calls = [];
    const mock = installFetch((call) => {
      calls.push(call);
      return new Response(JSON.stringify({ ok: true, duplicate: false, calendar: "not_configured" }), { status: 200 });
    });
    try {
      const reply = await forwardBookingPaid(testEnv(), prepared.payload);
      assert.equal(reply.ok, true);
      assert.equal(reply.calendar, "not_configured");
    } finally {
      mock.restore();
    }
    const sent = JSON.parse(calls[0].body);
    assert.deepEqual(Object.keys(sent).sort(), [
      "amount_cents", "booking_id", "card", "customer", "customer_id", "event", "key",
      "payment_intent_id", "plan", "price_per_visit", "service_day", "stripe_customer_id",
      "test", "visits", "window_label", "zone",
    ]);
    assert.equal(sent.event, "booking_paid");
    assert.equal(sent.key, HOOK_KEY);
    assert.equal(sent.test, true);
    assert.equal(sent.customer_id, "LC-26111815000042");
    assert.match(sent.customer_id, /^LC-\d+$/);
    assert.equal(sent.plan, "package");
    assert.equal(sent.zone, 1);
    assert.equal(sent.amount_cents, 15400);
    assert.equal(sent.price_per_visit, 45);
    assert.equal(sent.service_day, "Tue");
    assert.equal(sent.window_label, "10 AM\u201312 PM");
    assert.equal(sent.customer.phone, "(954) 555-0123");
    assert.deepEqual(sent.card, { brand: "visa", last4: "4242", saved: true });
    assert.deepEqual(sent.visits, [
      { n: 1, date: "12/1/2026", label: "Tuesday, December 1" },
      { n: 2, date: "12/15/2026", label: "Tuesday, December 15" },
      { n: 3, date: "12/29/2026", label: "Tuesday, December 29" },
      { n: 4, date: "1/12/2027", label: "Tuesday, January 12" },
    ]);
    const refused = installFetch(() => {
      throw new Error("should not send");
    });
    try {
      await assert.rejects(() => forwardBookingPaid(testEnv(), { ...prepared.payload, customer_id: "LC-251120-143055" }));
    } finally {
      refused.restore();
    }
    for (const [status, body] of [[200, "Accepted"], [200, JSON.stringify({ ok: false })], [500, JSON.stringify({ ok: true })], [200, ""]]) {
      const fail = installFetch(() => new Response(body, { status }));
      try {
        await assert.rejects(() => forwardBookingPaid(testEnv(), prepared.payload));
      } finally {
        fail.restore();
      }
    }
  });

  test("per-visit zone 2 is $55 and the browser cannot set the amount", async () => {
    const env = testEnv();
    const mock = installFetch((call) => {
      if (call.url === HOOK) return new Response(JSON.stringify(sheet([])), { status: 200 });
      const url = new URL(call.url);
      assert.equal(call.headers.Authorization, `Bearer ${TEST_KEY}`);
      assert.equal(call.headers["Stripe-Version"], "2026-09-30.endive");
      if (url.pathname === "/v1/customers") return Response.json({ id: "cus_test_zone2" });
      if (url.pathname === "/v1/payment_intents") {
        const form = new URLSearchParams(call.body);
        assert.equal(form.get("amount"), "5500");
        assert.equal(form.get("metadata[business]"), "lawns_by_timmy");
        assert.equal(form.get("metadata[kind]"), "booking");
        assert.equal(form.get("metadata[zone]"), "2");
        assert.equal(form.get("metadata[plan]"), "per_visit");
        assert.match(form.get("metadata[crm_customer_id]"), /^LC-\d+$/);
        assert.equal(form.get("setup_future_usage"), "off_session");
        return Response.json({ id: "pi_test_zone2", client_secret: "pi_test_zone2_secret_xxx" });
      }
      return Response.json({ error: { message: "unexpected" } }, { status: 500 });
    });
    try {
      const listed = await env.SLOT_LEDGER_TEST.list();
      const slot = firstSlot(listed);
      const res = await onHold({
        request: new Request("https://book.test/api/book/hold", {
          method: "POST",
          headers: { Origin: "https://book.test", "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: "Test",
            last_name: "Booker",
            phone: "9545550123",
            email: "booker@example.test",
            address: "1 Test St",
            city: "Fort Lauderdale",
            zip: "33304",
            yard: "yes",
            plan: "per_visit",
            date: slot.date,
            window_id: slot.windowId,
            amount_cents: 100,
            sms_consent: true,
            save_card: true,
          }),
        }),
        env,
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.amount_cents, 5500);
      assert.match(body.customer_id, /^LC-\d+$/);
      const availability = JSON.parse(mock.calls.find((call) => call.url === HOOK).body);
      assert.deepEqual(availability, { event: "availability_snapshot", key: HOOK_KEY });
    } finally {
      mock.restore();
    }
  });

  test("switching to per visit updates the PaymentIntent from the ZIP, not the browser", async () => {
    const env = testEnv();
    const mock = installFetch((call) => {
      if (call.url === HOOK) return new Response(JSON.stringify(sheet([])), { status: 200 });
      const url = new URL(call.url);
      if (url.pathname === "/v1/customers") return Response.json({ id: "cus_test_switch" });
      if (call.method === "POST" && url.pathname === "/v1/payment_intents") {
        return Response.json({ id: "pi_test_switch", client_secret: "pi_test_switch_secret_xxx" });
      }
      if (call.method === "POST" && url.pathname === "/v1/payment_intents/pi_test_switch") {
        const form = new URLSearchParams(call.body);
        assert.equal(form.get("amount"), "4500");
        assert.equal(form.get("metadata[plan]"), "per_visit");
        return Response.json({ id: "pi_test_switch", client_secret: "pi_test_switch_secret_xxx" });
      }
      return Response.json({ error: { message: "unexpected" } }, { status: 500 });
    });
    try {
      const slot = firstSlot(await env.SLOT_LEDGER_TEST.list());
      const held = await onHold({
        request: new Request("https://book.test/api/book/hold", {
          method: "POST",
          headers: { Origin: "https://book.test" },
          body: JSON.stringify({
            first_name: "Test", last_name: "Booker", phone: "9545550123", email: "booker@example.test",
            address: "1 Test St", city: "Oakland Park", zip: "33309", yard: "yes", plan: "package",
            date: slot.date, window_id: slot.windowId, amount_cents: 100,
          }),
        }),
        env,
      });
      assert.equal(held.status, 200);
      const booking = await held.json();
      assert.equal(booking.amount_cents, 15400);
      const updated = await onUpdate({
        request: new Request("https://book.test/api/book/update", {
          method: "POST",
          headers: { Origin: "https://book.test" },
          body: JSON.stringify({ booking_id: booking.booking_id, plan: "per_visit", save_card: true, amount_cents: 100 }),
        }),
        env,
      });
      assert.equal(updated.status, 200);
      assert.equal((await updated.json()).amount_cents, 4500);
    } finally {
      mock.restore();
    }
  });

  test("switching plans uses the yard saved on the hold", async () => {
    const env = testEnv();
    const slot = firstSlot(await env.SLOT_LEDGER_TEST.list());
    await env.SLOT_LEDGER_TEST.hold(holdInput("BK-aabbccddeeff0011", slot, { yard: "no" }));
    await env.SLOT_LEDGER_TEST.attachPayment("BK-aabbccddeeff0011", {
      paymentIntentId: "pi_test_yard",
      stripeCustomerId: "cus_test_yard",
    });
    const mock = installFetch(() => {
      throw new Error("should not reprice a yard that is too big");
    });
    try {
      const res = await onUpdate({
        request: new Request("https://book.test/api/book/update", {
          method: "POST",
          headers: { Origin: "https://book.test" },
          body: JSON.stringify({ booking_id: "BK-aabbccddeeff0011", plan: "per_visit" }),
        }),
        env,
      });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.payable, false);
      assert.equal(body.reason, "yard");
      assert.equal(mock.calls.length, 0);
    } finally {
      mock.restore();
    }
  });

  test("zone 3 and a big yard never call Stripe", async () => {
    const env = testEnv();
    const mock = installFetch(() => {
      throw new Error("no outbound call");
    });
    try {
      const zone = await onQuote({
        request: new Request("https://book.test/api/book/quote?zip=33101&yard=yes&plan=package"),
        env,
      });
      assert.equal((await zone.json()).payable, false);
      const yard = await onHold({
        request: new Request("https://book.test/api/book/hold", {
          method: "POST",
          headers: { Origin: "https://book.test" },
          body: JSON.stringify({
            first_name: "Test", last_name: "Booker", phone: "9545550123", email: "booker@example.test",
            address: "1 Test St", city: "Oakland Park", zip: "33309", yard: "no", plan: "package",
            date: "2026-12-01", window_id: "0800-1000",
          }),
        }),
        env,
      });
      assert.equal(yard.status, 409);
      assert.equal(mock.calls.length, 0);
    } finally {
      mock.restore();
    }
  });
});

describe("webhook", () => {
  async function signed(env, event) {
    const payload = JSON.stringify(event);
    const header = await stripeSignature(WEBHOOK_SECRET, payload, Math.floor(Date.now() / 1000));
    return onBookingWebhook({
      request: new Request("https://book.test/api/stripe/booking-webhook", {
        method: "POST",
        headers: { "Stripe-Signature": header },
        body: payload,
      }),
      env,
    });
  }

  function paidEvent(booking, id = "evt_test_paid") {
    return {
      id,
      type: "payment_intent.succeeded",
      livemode: false,
      data: {
        object: {
          id: booking.paymentIntentId,
          object: "payment_intent",
          status: "succeeded",
          livemode: false,
          charges: { data: [{ payment_method_details: { card: { brand: "visa", last4: "4242" } } }] },
          metadata: {
            business: "lawns_by_timmy",
            kind: "booking",
            booking_id: booking.bookingId,
            crm_customer_id: booking.customerId,
          },
        },
      },
    };
  }

  test("a duplicate event forwards once, a bad reply retries, and guards ignore the rest", async () => {
    const ledger = new MemoryLedger({}, { now: () => NOW });
    const slot = firstSlot(await ledger.list(), "1000-1200");
    const held = await ledger.hold(holdInput("BK-dddddddddddddddd", slot, { customerId: "LC-26111815000077" }));
    await ledger.attachPayment(held.booking.bookingId, {
      paymentIntentId: "pi_test_paid77",
      stripeCustomerId: "cus_test_paid77",
    });
    const booking = await ledger.read(held.booking.bookingId);
    const env = testEnv({ SLOT_LEDGER_TEST: ledger });
    let mode = "ok";
    const mock = installFetch((call) => {
      if (mode === "accepted") return new Response("Accepted", { status: 200 });
      const body = JSON.parse(call.body);
      assert.equal(body.event, "booking_paid");
      assert.equal(body.key, HOOK_KEY);
      assert.equal(body.test, true);
      assert.equal(body.payment_intent_id, "pi_test_paid77");
      return Response.json({ ok: true, duplicate: false });
    });
    try {
      mode = "accepted";
      const failed = await signed(env, paidEvent(booking, "evt_retry"));
      assert.equal(failed.status, 500);
      mode = "ok";
      const paid = await signed(env, paidEvent(booking, "evt_retry"));
      assert.equal(paid.status, 200);
      const again = await signed(env, paidEvent(booking, "evt_retry"));
      assert.equal(again.status, 200);
      assert.equal((await again.json()).duplicate, true);
      const forwards = mock.calls.filter((call) => call.url === HOOK && JSON.parse(call.body).event === "booking_paid");
      assert.equal(forwards.length, 2);
      const saved = await ledger.read(booking.bookingId);
      assert.equal(saved.forwarded, true);
      assert.equal(saved.cardLast4, "4242");

      const live = await signed(env, { ...paidEvent(booking, "evt_live"), livemode: true });
      assert.equal((await live.json()).ignored, true);
      const other = await signed(env, paidEvent({ ...booking, bookingId: booking.bookingId }, "evt_other"));
      const otherEvent = paidEvent(booking, "evt_fork");
      otherEvent.data.object.metadata.business = "fork_algorithm";
      const foreign = await signed(env, otherEvent);
      assert.equal((await foreign.json()).ignored, true);
      const nameless = paidEvent(booking, "evt_none");
      delete nameless.data.object.metadata.business;
      const unnamed = await signed(env, nameless);
      assert.equal((await unnamed.json()).ignored, true);
      assert.equal(other.status, 200);

      const setup = {
        id: "evt_setup",
        type: "setup_intent.succeeded",
        livemode: false,
        data: {
          object: {
            id: "seti_test_book",
            object: "setup_intent",
            livemode: false,
            payment_method: { card: { brand: "visa", last4: "1111" } },
            metadata: { business: "lawns_by_timmy", kind: "booking", booking_id: booking.bookingId },
          },
        },
      };
      const before = mock.calls.length;
      assert.equal((await signed(env, setup)).status, 200);
      assert.equal(mock.calls.length, before);
      assert.equal((await ledger.read(booking.bookingId)).cardLast4, "1111");
    } finally {
      mock.restore();
    }
  });

  test("a declined payment releases the hold", async () => {
    const ledger = new MemoryLedger({ BOOKING_CONFIG_JSON: JSON.stringify({ capPerWindow: 1 }) }, { now: () => NOW });
    const slot = firstSlot(await ledger.list());
    const held = await ledger.hold(holdInput("BK-eeeeeeeeeeeeeeee", slot));
    await ledger.attachPayment(held.booking.bookingId, { paymentIntentId: "pi_test_fail", stripeCustomerId: "cus_test_fail" });
    const env = testEnv({ SLOT_LEDGER_TEST: ledger });
    const event = {
      id: "evt_fail",
      type: "payment_intent.payment_failed",
      livemode: false,
      data: {
        object: {
          id: "pi_test_fail",
          livemode: false,
          metadata: { business: "lawns_by_timmy", kind: "booking", booking_id: held.booking.bookingId },
        },
      },
    };
    assert.equal((await signed(env, event)).status, 200);
    const next = await ledger.hold(holdInput("BK-ffffffffffffffff", slot, { customerId: "LC-26111815000099" }));
    assert.equal(next.ok, true);
  });

  test("a bad signature is rejected and does not call out", async () => {
    const env = testEnv();
    const mock = installFetch(() => {
      throw new Error("should not call");
    });
    try {
      const res = await onBookingWebhook({
        request: new Request("https://book.test/api/stripe/booking-webhook", {
          method: "POST",
          headers: { "Stripe-Signature": "t=1,v1=00" },
          body: JSON.stringify({ id: "evt_bad", type: "payment_intent.succeeded" }),
        }),
        env,
      });
      assert.equal(res.status, 400);
      assert.equal(mock.calls.length, 0);
    } finally {
      mock.restore();
    }
  });
});

describe("live keys and the closed switch", () => {
  test("a missing ASSETS binding is a 404", async () => {
    const missing = await worker.fetch(new Request("https://lawnsbytimmy.com/"), {});
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "Not found" });

    let fetched = false;
    const served = await worker.fetch(new Request("https://lawnsbytimmy.com/privacy.html"), {
      ASSETS: {
        fetch(request) {
          fetched = true;
          assert.equal(new URL(request.url).pathname, "/privacy.html");
          return new Response("ok", { status: 200 });
        },
      },
    });
    assert.equal(fetched, true);
    assert.equal(served.status, 200);
  });

  test("a live key, a missing flag, or no ledger keeps every booking route closed", async () => {
    const base = {
      BOOKING_MODE: "test",
      STRIPE_LBT_TEST_SECRET_KEY: TEST_KEY,
      STRIPE_LBT_TEST_PUBLISHABLE_KEY: PUBLISHABLE,
      STRIPE_BOOKING_WEBHOOK_SECRET: WEBHOOK_SECRET,
      BOOKING_WEBHOOK_URL: HOOK,
      BOOKING_WEBHOOK_KEY: HOOK_KEY,
      SLOT_LEDGER_TEST: {},
    };
    assert.equal(bookingMode(base), "test");
    assert.equal(bookingMode({ ...base, STRIPE_LBT_TEST_SECRET_KEY: "sk_live_example" }), "off");
    assert.equal(bookingMode({ ...base, STRIPE_LBT_TEST_SECRET_KEY: "rk_live_example" }), "off");
    assert.equal(bookingMode({ ...base, STRIPE_LBT_TEST_PUBLISHABLE_KEY: "pk_live_example" }), "off");
    assert.equal(bookingMode({ ...base, BOOKING_MODE: "" }), "off");
    assert.equal(bookingMode({ ...base, SLOT_LEDGER_TEST: undefined, SLOT_LEDGER: undefined }), "off");

    const calls = [];
    const mock = installFetch(() => {
      calls.push(1);
      throw new Error("should not call");
    });
    try {
      await assert.rejects(() => stripe({ STRIPE_LBT_TEST_SECRET_KEY: "sk_live_example" }, "/customers"));
      const res = await worker.fetch(new Request("https://lawnsbytimmy.com/api/book/hold", {
        method: "POST",
        body: JSON.stringify({ amount_cents: 100 }),
      }), {
        BOOKING_MODE: "test",
        STRIPE_LBT_TEST_SECRET_KEY: "sk_live_example",
        STRIPE_LBT_TEST_PUBLISHABLE_KEY: PUBLISHABLE,
        STRIPE_BOOKING_WEBHOOK_SECRET: WEBHOOK_SECRET,
        BOOKING_WEBHOOK_URL: HOOK,
        BOOKING_WEBHOOK_KEY: HOOK_KEY,
      });
      assert.equal(res.status, 404);
      assert.deepEqual(await res.json(), { error: "Not found" });
      const closed = await worker.fetch(new Request("https://lawnsbytimmy.com/api/book/config"), {});
      assert.equal(closed.status, 404);
      assert.equal(calls.length, 0);
    } finally {
      mock.restore();
    }
  });

  test("the production config and the homepage do not grow a booking switch", () => {
    const workerSrc = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
    const entry = readFileSync(new URL("../booking-worker.js", import.meta.url), "utf8");
    const prod = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
    const home = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const page = readFileSync(new URL("../../book/index.html", import.meta.url), "utf8");
    const docs = readFileSync(new URL("../../docs/booking-test-worker.md", import.meta.url), "utf8");
    assert.equal(workerSrc.includes("ledger.js"), false);
    assert.equal(workerSrc.includes("STRIPE_SECRET_KEY"), false);
    assert.match(entry, /SlotLedger/);
    assert.equal(prod.includes("SlotLedger"), false);
    assert.equal(prod.includes("BOOKING_MODE"), false);
    assert.equal(home.includes("/book/"), false);
    assert.match(page, /Booking isn't open yet\./);
    assert.match(page, /I agree to receive text messages from Lawns by Timmy at the number provided/);
    assert.equal(page.includes("8\u201310 AM"), false);
    assert.equal(page.includes("8-10 AM"), false);
    assert.equal(docs.includes("make.com"), false);
    assert.equal(docs.includes("sk_live_"), false);
    assert.equal(page.includes("sk_live_"), false);
    assert.equal(page.includes("sk_test_"), false);
  });
});

describe("payload helper", () => {
  test("bookingPaidPayload does not invent a hyphenated customer id", () => {
    const payload = bookingPaidPayload({
      visits: ["2026-12-01", "2026-12-15", "2026-12-29", "2027-01-12"],
      customer: customer({ sms_consent: true }),
      paymentIntentId: "pi_test_direct",
      bookingId: "BK-1111111111111111",
      customerId: "LC-26111815000003",
      plan: "per_visit",
      zone: 2,
      amountCents: 5500,
      pricePerVisit: 55,
      windowLabel: "8\u201310 AM",
      stripeCustomerId: "cus_test_direct",
      cardBrand: "visa",
      cardLast4: "4242",
      saveCard: false,
    });
    assert.equal(payload.plan, "per_visit");
    assert.equal(payload.customer.sms_consent, true);
    assert.equal(payload.card.saved, false);
    assert.match(payload.customer_id, /^LC-\d+$/);
  });
});
