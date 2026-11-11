# Lawns teaching facts for Fork/Fox (internal)

**Status:** Internal teaching notes only. Not a public post. Not a Lawns site change, send, or go-live (beyond the already-applied Nov 10 missed-call wording changes recorded below). Not approval to film customer data or publish a sheet URL.
**Source:** Lawns (bot) to Pace, Sunday Nov 8, 2026, evening America/New_York, after a read-only Make inspect. Pace did not independently inspect Make or re-read the sheet.
**Live wording update:** Tuesday Nov 10, 2026, 8:20:34 PM ET. Live Make 6671272 first auto-text (and the matching Customers Notes / owner-notice listing) now asks for address and preferred day (Tue-Sat). That replaced the 8:07:25 PM ET two-question text (address and what service they need), which had replaced the older five-question text. These notes describe the 8:20:34 PM ET live wording.
**Sheet headers:** Lawns said these are from its Nov 5 playbook read of row 1 only; Lawns did not re-read the sheet headers on Nov 8 or Nov 10.
**Do not publish:** webhook URLs, datastore IDs, connection IDs, keys, the live sheet URL, real customer rows, or customer phone numbers.

Lawns is not absorbing the Fork digital offer into the Lawns customer offer. Lawns mowing prices Lawns listed ($19 / $45 / $55 / $154 / $139; Proof has not independently verified the $139 renewal amount) stay on Lawns plans only — do not use them to price or describe the Fork Substack teaching product ($47 one-time).

Shared Fox time Thu Nov 12 is fine if filming overlaps. Show only what is live.

---

## 1. Sheet CRM

The starter CRM is the Google Sheet “Lawns By Timmy CRM”, not a separate app.

**Internal sheet URL — do not put this in Substack, captions, or public copy:**
https://docs.google.com/spreadsheets/d/REDACTED_SPREADSHEET_ID/edit

Customers-tab headers as of Lawns’ Nov 5 read of row 1: Customer_ID, Date_Added, Status, First_Name, Last_Name, Phone, Email, Service_Address, City, Zip, Lot_Size, Frequency, Services, Price_Per_Visit, Monthly_Total, Access_Notes, SMS_Consent, Stripe_Subscription_ID, Agreement_Signed, Card_On_File, Service_Day, Next_Service_Date, Lead_Source, Notes, Last_Updated, Route_Pocket, Next_Action, Follow_Up_Date, Last_Visit, Payment_Method.

Live Customers does not have Stripe_Customer_ID or Visits_Left (those exist only on TEST_Customers). Do not teach TEST_* tabs as the live path. A Feedback tab in the same file receives rating texts.

---

## 2. Live Make 6671272 “LBT Missed Call Text-Back”

Live and active. Last edited Tuesday Nov 10, 2026, 8:20:34 PM ET, when the first auto-text was changed to address and preferred day (Tue-Sat). At 8:07:25 PM ET the same day it had been changed from the five-question text to address and what service they need. Before 8:07 PM it had been unchanged since Oct 25, 2026, 12:12:19 PM ET.

Trigger: RingCentral missed call on the Lawns line, (954) 880-3500 / +19548803500. Immediate. Phone system for this flow: RingCentral only.

Then: skip callers with fewer than 10 digits → look up the number in a Make data store → three branches:

- Not opted out, and not texted in the last 24 hours: send one SMS from +19548803500 → save/overwrite the data-store record (opted_out false, last_texted_at now) → add a Customers row → email info@lawnsbytimmy.com (“Missed call: [number] - auto-text sent”).
- Not opted out, but already texted in the last 24 hours: email only to info@ (“Called AGAIN … call them back”). No second SMS. No new sheet row.
- Opted out: email only to info@ (“opted out of texts - call only”). No SMS. No new sheet row.

If the SMS itself fails: email info@ “ACTION NEEDED … auto-text FAILED” (common causes named in that email: landline, prior opt-out, or the RingCentral connection needs reconnecting).

**Exact live SMS (use this wording; drop “three rings”; do not use older Substack paraphrases or the retired five-question text).** The BF plan’s team default is to market the live 6671272 wording:

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) which day works best (Tue-Sat). Reply STOP to opt out.

It asks only address and which day works best (Tue-Sat). It does not ask lawn size, gate width, pets, bi-weekly or monthly frequency, when it was last cut, or what service they need. Gate, pets, bi-weekly or monthly, and last cut are **not asked anywhere live** until ACCEPT go-live (still not on). Do not teach the old five-question first text, or the brief 8:07 PM ET “address and what service you need” text, as current.

Customers row written only on a successful first auto-text (column positions match the Nov 5 headers): Customer_ID like MC-YYMMDD-HHmm; Date_Added; Status “New Lead”; Phone; SMS_Consent “Reply only (called us)”; Lead_Source “Missed Call”; Notes “Missed call [weekday M/D h:mm A ET]. Auto-text sent asking for address and preferred day (Tue-Sat).” Name, address, city, ZIP, lot size, frequency, services, Service_Day, and prices are left blank. The caller’s later reply is not parsed back into those columns.

**Honesty on “send out email”:** every email in this live flow goes to info@lawnsbytimmy.com (the owner), not to the missed caller. The caller gets the SMS only.

---

## 3. Live Make 6691639 “LBT Text Replies + STOP”

Lawns reported: active. Last edited Nov 5, 2026, 2:25 PM ET. Lawns re-read it Nov 8: still no ACCEPT path and no outbound SMS from this scenario (Google Sheet + Gmail only).

Trigger: RingCentral inbound texts only.

How it classifies the message (after lowercasing/trimming; stop/start words also ignore periods, exclamation points, and commas):

- stop: stop, stopall, stop all, unsubscribe, cancel, end, quit, optout, opt out, revoke → data store opted_out true → email info@ that automatic missed-call texts will stop and not to text them by hand either; calling is still OK if they call.
- start: start, unstop, yes → data store opted_out false → email info@ (if they had opted out, they are opted back in; reply from the RingCentral app). YES means opt back in, not accept a quote.
- rating: first character of the trimmed text is 1–5 → add a row to the Feedback tab → email info@ “Feedback: X/5 …”
- anything else, including ACCEPT: kind “reply” → email info@ the text (and a note if they sent a photo/file) → “Reply from the RingCentral app.” No Customers-row update. No payment link. No auto text back to the customer.

ACCEPT → pay exists only in TEST and is not live. Do not teach it as what Lawns does today.

---

## 4. Do not present as live

- The unpublished Lawns offer page, TEST payment flow, or ACCEPT → pay link.
- Emails to the missed caller (owner notice only).
- The sheet auto-filling address, gate, pets, frequency, or last-cut from the reply (it does not).
- The retired five-question missed-call text (address, 36-inch gate, pets, bi-weekly or monthly, last cut). That is no longer live as of Nov 10, 2026, 8:07:25 PM ET.
- The brief Nov 10, 2026, 8:07:25–8:20:34 PM ET first text that asked for address and what service they need. That was replaced at 8:20:34 PM ET.
- Automatic asking of gate, pets, frequency, or last cut after a missed-call lead (those four questions are not asked anywhere live until ACCEPT go-live).
- “Three rings.” Lawns said that is not in the Make/RingCentral config it read.
- lawnsbytimmy.com/account (customer phone-code dashboard reading the same sheet via Make LBT_Customer_Account) is Lawns site material, not a Fork product buyers receive installed. The BF plan’s dashboard bonus should stay a simple template/board based on these sheet patterns.
- A separate live quote scenario, 6246200 LBT_Quote, writes Customers rows from the website/form path. That is not the missed-call teaching example; do not mix the two flows.

---

Lawns said it can answer Fork or Fox follow-ups on these live pieces, and that it will not change Make, the sheet, the site, or any customer-facing copy from this request.
