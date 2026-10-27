// GET /api/account/me — everything the dashboard shows for the signed-in customer.
// It all comes from the CRM sheet (Customers, Invoices and Jobs tabs), read through Make.com.
import { json, getSession, readCrm, findCustomers, normalizePhone, PHONE } from "./lib.js";

const money = (v) => {
  const n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// "10/28/2026" -> "2026-10-28"; anything else -> "".
function isoDate(v) {
  const m = String(v || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
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
      next_service_date: isoDate(c.Next_Service_Date),
      balance: bills.reduce((s, b) => s + (b.paid ? 0 : b.balance), 0),
      bills: bills.slice(0, 12),
      visits: visits.slice(0, 6),
      pay_methods: payMethods,
      business_phone: PHONE,
    });
  } catch (err) {
    console.error("me error", err);
    return json({ error: "We couldn't load your account right now." }, 500);
  }
}
