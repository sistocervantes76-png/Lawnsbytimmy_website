// Unit tests for the account page's next-visit date. Fictional rows only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { SESSION_COOKIE, signToken } from "./lib.js";
import { nextVisit, onRequestGet, todayEt } from "./me.js";

const TODAY = "2026-11-12";
const customer = (id, next = "") => ({ Customer_ID: id, Next_Service_Date: next });
const job = (id, status, date) => ({ Customer_ID: id, Job_Status: status, Service_Date: date });

test("picks the earliest future Scheduled row for this customer", () => {
  const crm = {
    jobs: [
      job("LC-9001", "Scheduled", "12/3/2026"),
      job("LC-9001", " scheduled ", " 11/18/2026 "),
      job("LC-9001", "Scheduled", "11/25/2026"),
      job("LC-9002", "Scheduled", "11/13/2026"),
    ],
  };
  // A nearer Customers date must not beat an earlier scheduled job.
  assert.equal(nextVisit(crm, customer("LC-9001", "11/13/2026"), TODAY), "2026-11-18");
});

test("unpadded month and day still sort in calendar order", () => {
  const crm = {
    jobs: [
      job("LC-9001", "Scheduled", "11/5/2026"),
      job("LC-9001", "Scheduled", "11/20/2026"),
    ],
  };
  assert.equal(nextVisit(crm, customer("LC-9001"), "2026-11-01"), "2026-11-05");
});

test("ignores past Scheduled rows and keeps a visit dated today", () => {
  const crm = {
    jobs: [
      job("LC-9001", "Scheduled", "10/28/2026"),
      job("LC-9001", "Scheduled", "11/11/2026"),
      job("LC-9001", "SCHEDULED", "11/12/2026"),
      job("LC-9001", "Scheduled", "12/2/2026"),
    ],
  };
  assert.equal(nextVisit(crm, customer("LC-9001", "1/1/2020"), TODAY), "2026-11-12");
});

test("ignores Completed, In Progress, and blank-date rows", () => {
  const crm = {
    jobs: [
      job("LC-9001", "Completed", "11/13/2026"),
      job("LC-9001", "In Progress", "11/14/2026"),
      job("LC-9001", "Scheduled", ""),
      job("LC-9001", "Rescheduled", "11/15/2026"),
      job("LC-9001", "Scheduled", "11/20/2026"),
    ],
  };
  assert.equal(nextVisit(crm, customer("LC-9001"), TODAY), "2026-11-20");
});

test("falls back to a future Next_Service_Date when no scheduled job qualifies", () => {
  const crm = { jobs: [job("LC-9001", "Completed", "11/13/2026")] };
  assert.equal(nextVisit(crm, customer("LC-9001", "11/19/2026"), TODAY), "2026-11-19");
  assert.equal(nextVisit(crm, customer("LC-9001", "11/12/2026"), TODAY), "2026-11-12");
});

test("a past Next_Service_Date returns blank", () => {
  const crm = { jobs: [job("LC-9001", "Scheduled", "11/4/2026")] };
  assert.equal(nextVisit(crm, customer("LC-9001", "11/5/2026"), TODAY), "");
  assert.equal(nextVisit({ jobs: [] }, customer("LC-9001", ""), TODAY), "");
});

test("a date without a year is ignored", () => {
  const crm = {
    jobs: [
      job("LC-9001", "Scheduled", "11/18"),
      job("LC-9001", "Scheduled", "11/18/26"),
      job("LC-9001", "Scheduled", "11/25/2026"),
    ],
  };
  assert.equal(nextVisit(crm, customer("LC-9001", "11/19"), TODAY), "2026-11-25");
  assert.equal(nextVisit({ jobs: [] }, customer("LC-9001", "11/19"), TODAY), "");
});

test("todayEt at 11:30 PM ET is still that ET date, not the next UTC day", () => {
  // 11:30 PM Eastern on Nov 12, 2026 is 04:30 UTC on Nov 13 (EST, UTC-5).
  assert.equal(todayEt(new Date("2026-11-13T04:30:00Z")), "2026-11-12");
  assert.equal(todayEt(new Date("2026-11-13T04:59:59Z")), "2026-11-12");
  // Midnight Eastern is the next calendar day.
  assert.equal(todayEt(new Date("2026-11-13T05:00:00Z")), "2026-11-13");
  // Same check in daylight time (EDT, UTC-4): 11:30 PM ET is 03:30 UTC the next day.
  assert.equal(todayEt(new Date("2026-07-13T03:30:00Z")), "2026-07-12");
});

test("a missing Jobs tab returns the fallback", () => {
  assert.equal(nextVisit({}, customer("LC-9001", "12/1/2026"), TODAY), "2026-12-01");
  assert.equal(nextVisit({ jobs: undefined }, customer("LC-9001", "10/1/2026"), TODAY), "");
});

// Calls the account handler with a stubbed CRM snapshot. Fetch never leaves the test.
async function loadAccount(valueRanges) {
  const secret = "unit-test-session-secret-32chars-min";
  const phone = "5550100199";
  const token = await signToken(
    { p: "session", cid: "LC-9001", phone, exp: Date.now() + 60_000 },
    secret
  );
  const requested = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requested.push(String(url));
    return new Response(JSON.stringify({ valueRanges }), { status: 200 });
  };
  try {
    const res = await onRequestGet({
      request: new Request("https://example.test/api/account/me", {
        headers: { Cookie: `${SESSION_COOKIE}=${token}` },
      }),
      env: {
        SESSION_SECRET: secret,
        ACCOUNT_WEBHOOK_URL: "http://127.0.0.1/mock-crm",
        ACCOUNT_WEBHOOK_KEY: "unit-test-webhook-key",
      },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(requested, ["http://127.0.0.1/mock-crm"]);
    return res.json();
  } finally {
    globalThis.fetch = original;
  }
}

const customers = (next) => ({
  range: "Customers!A1:F2",
  values: [
    ["Customer_ID", "First_Name", "Phone", "Service_Day", "Next_Service_Date"],
    ["LC-9001", "Casey", "555-010-0199", "Wednesday", next],
  ],
});
const invoices = { range: "Invoices!A1:A1", values: [["Invoice_ID"]] };

test("GET /api/account/me uses the scheduled job and does not call a live webhook", async () => {
  const data = await loadAccount([
    customers("6/1/2099"),
    invoices,
    {
      range: "Jobs!A1:D5",
      values: [
        ["Customer_ID", "Job_Status", "Service_Date", "Service_Type"],
        ["LC-9001", "Scheduled", "1/1/2000", "Mow"],
        ["LC-9001", "Completed", "1/2/2099", "Mow"],
        ["LC-9001", "Scheduled", "1/15/2099", "Mow"],
        ["LC-9002", "Scheduled", "1/3/2099", "Mow"],
      ],
    },
  ]);
  assert.equal(data.signed_in, true);
  assert.equal(data.next_service_date, "2099-01-15");
  assert.equal(data.property.service_day, "Wednesday");
  assert.equal(data.visits.length, 1);
});

test("GET /api/account/me leaves next visit blank when every date is past", async () => {
  const data = await loadAccount([
    customers("1/1/2000"),
    invoices,
    {
      range: "Jobs!A1:D2",
      values: [
        ["Customer_ID", "Job_Status", "Service_Date"],
        ["LC-9001", "Scheduled", "1/2/2000"],
      ],
    },
  ]);
  assert.equal(data.next_service_date, "");
  assert.equal(data.property.service_day, "Wednesday");
});

test("GET /api/account/me falls back when the Jobs tab is missing", async () => {
  const data = await loadAccount([customers("6/1/2099"), invoices]);
  assert.equal(data.next_service_date, "2099-06-01");
});
