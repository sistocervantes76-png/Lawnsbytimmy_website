// GET /api/account/me — everything the dashboard shows for the signed-in customer.
// It all comes from the CRM sheet (Customers, Invoices and Jobs tabs), read through Make.com.
import { json, getSession, readCrm, findCustomers, normalizePhone, PHONE } from "./lib.js";
import { cardSaveMode, customerMaySaveCard, consentMessage, cardSummary } from "./card.js";

const money = (v) => {
  const n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// "10/28/2026" -> "2026-10-28"; anything else (including a date with no year) -> "".
function isoDate(v) {
  const m = String(v || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
}

// Today's date in Florida as "YYYY-MM-DD" (the Worker clock is UTC).
export function todayEt(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

// Next visit = earliest "Scheduled" Jobs row dated today or later.
// Falls back to Customers.Next_Service_Date only if that date is not in the past.
// Returns "" when neither works, and the page then shows "Your regular {day} route".
export function nextVisit(crm, c, today = todayEt()) {
  const fromJobs = (crm.jobs || [])
    .filter((j) => j.Customer_ID === c.Customer_ID && /^\s*scheduled\s*$/i.test(j.Job_Status || ""))
    .map((j) => isoDate(j.Service_Date))
    .filter((d) => d && d >= today)
    .sort()[0];
  if (fromJobs) return fromJobs;
  const fallback = isoDate(c.Next_Service_Date);
  return fallback && fallback >= today ? fallback : "";
}

const newestFirst = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (!session) return json({ signed_in: false }, 401);

  try {
    const crm = await readCrm(env);
    // The phone must still match, so changing a number in the CRM locks out the old phone.
    const [c] = findCustomers(
      crm,
      (row) => row.Customer_ID === session.cid && normalizePhone(row.Phone) === session.phone
    );
    if (!c) return json({ signed_in: false }, 401);

    const bills = crm.invoices
      .filter((i) => i.Customer_ID === c.Customer_ID && i.Invoice_ID)
      .map((i) => ({
        date: isoDate(i.Invoice_Date),
        description: i.Description || "Lawn service",
        amount: money(i.Amount),
        balance: money(i.Balance),
        paid: /paid/i.test(i.Status) || money(i.Balance) === 0,
      }))
      .sort(newestFirst);

    const visits = crm.jobs
      .filter((j) => j.Customer_ID === c.Customer_ID && /completed/i.test(j.Job_Status))
      .map((j) => ({ date: isoDate(j.Completed_At || j.Service_Date), service: j.Service_Type || "Lawn service" }))
      .filter((v) => v.date)
      .sort(newestFirst);

    const payMethods = ["Cash", "Apple Pay"];
    if (/zelle/i.test(c.Payment_Method || "")) payMethods.push("Zelle");

    const cardSaveEnabled = cardSaveMode(env) === "test" && customerMaySaveCard(c);

    return json({
      signed_in: true,
      name: [c.First_Name, c.Last_Name].filter(Boolean).join(" "),
      first_name: c.First_Name || "",
      phone: session.phone,
      property: {
        service_address: c.Service_Address || "",
        city: String(c.City || "").replace(/,?\s*Florida$/i, ""),
        zip: c.Zip || "",
        frequency: c.Frequency || "",
        services: c.Services || "",
        access_notes: /needs confirmation/i.test(c.Access_Notes || "") ? "" : c.Access_Notes || "",
        service_day: c.Service_Day || "",
      },
      next_service_date: nextVisit(crm, c),
      balance: bills.reduce((s, b) => s + (b.paid ? 0 : b.balance), 0),
      bills: bills.slice(0, 12),
      visits: visits.slice(0, 6),
      pay_methods: payMethods,
      business_phone: PHONE,
      card: cardSummary(c.Card_On_File),
      card_save_enabled: cardSaveEnabled,
      consent_text: cardSaveEnabled ? consentMessage(c.Price_Per_Visit) : "",
    });
  } catch (err) {
    console.error("me error: " + (err?.message || err), err?.stack);
    return json({ error: "We couldn't load your account right now." }, 500);
  }
}
