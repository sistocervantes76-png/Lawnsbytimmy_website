# Changelog

Dates and times are America/New_York.

## 2026-11-10, 8:39 PM ET — Website Option B chosen (plan only, not applied)

- **When:** Tuesday, Nov 10, 2026, 8:39 PM ET, in Proof's chat.
- **What:** Sisto picked **Option B** on Proof's card: "B: keep yard size and frequency for the instant price, add the Tue-Sat day." Lawns could not see the card pick itself in the transcript. This is recorded as **relayed by Proof** (Proof's 8:39 PM ET chat message to him states the switch from A to B). Under Option B the form keeps contact info, address, lot size, and frequency so the instant price stays; adds a required Tue/Wed/Thu/Fri/Sat day field mapped into Service_Day (column 20) and the owner email; and moves gate and pets off the form until after they accept. That Service_Day mapping would only write new Website Form rows; it would not overwrite the Wed/Thu values already on five Active Recurring rows.
- **Exact plan:** `playbooks/lawns-website-option-b-apply-plan-2026-11-10.md`. **Draft only. Pending Proof's check**, then Sisto's OK on the live change, before any website PR or 6246200 patch.
- **What did not change:** The live homepage, 6246200, 6671272, 6691639, TEST clones, Stripe, and RingCentral. No PR was opened. No merge or deploy. The earlier A/B plan (`de5d2ad2…`) was left unchanged.

## 2026-11-10, 8:32–8:33 PM ET — Website Option A answers (superseded; history only)

- **When:** Tuesday, Nov 10, 2026, 8:32–8:33 PM ET, in Lawns chat (card answers, relayed by Lawns).
- **What:** Sisto chose **Option A with the Tue–Sat day choice** for the website quote form (contact, address, required day; drop lot size, frequency, gate, pets, and the auto-price; he would price web leads by hand). **Superseded at 8:39 PM ET** by the Option B pick in Proof's chat (see the entry above). Do not apply the Option A plan.
- **Exact plan (shelved):** `playbooks/lawns-website-option-a-day-plan-2026-11-10.md` is kept as history with a SUPERSEDED banner. It was never applied.
- **What did not change:** The live homepage, 6246200, and the rest of the stack. No PR was opened.

## 2026-11-10, 8:20:34 PM ET — Address + preferred day Tue–Sat (live, current)

- **When:** Tuesday, Nov 10, 2026, 8:20:34 PM ET.
- **What:** Live Make scenario **6671272** (LBT Missed Call Text-Back) first auto-text was changed from “address and what service you need” to “address and which day works best (Tue-Sat).” The CRM Notes field and the owner email notice were updated to match. The scenario stayed **active**.
- **New wording (155 characters, one GSM-7 segment):**

  > Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) which day works best (Tue-Sat). Reply STOP to opt out.

- **Why:** Sisto refined the two questions the same evening in Proof’s chat: address and when they’d like it done, then preferred day Mon–Fri, then “tuesday thru saturday is better.” Only this final Tue–Sat wording was written live. That is Sisto’s choice.
- **Proof:** Readback PASS. A full module-config comparison against the 8:19 PM ET pre-change backup showed only those three fields changed (module 4 text, module 8 Notes, module 9 owner-notice listing). After-snapshot: `make-scenarios/6671272_after_address_day_sms_20261110_modules.json`.
- **What did not change:** 6691639, 6246200, TEST clones, Stripe, the website, and RingCentral. The drafted after-ACCEPT text was not applied. The 8:07:25 PM ET service-question first text is **superseded** and is no longer live.
- **Follow-on (not applied):** The website plan was revised so “follow suit” means address + preferred day (Tue–Sat). Proof rechecked that plan at 8:26 PM ET: PASS, no required fixes. At that time it awaited Sisto’s A/B choice (B recommended: keep lot size and frequency, add a Tue–Sat day field mapped to Service_Day column 20 and the owner email, move gate and pets after accept). He later picked Option B at 8:39 PM ET (see above). Service_Day already holds Wed/Thu on five Active Recurring rows.

## 2026-11-10, 8:07:25 PM ET — Two-question missed-call first text, address + service (superseded)

- **When:** Tuesday, Nov 10, 2026, 8:07:25 PM ET.
- **What:** Live **6671272** first auto-text was changed from five questions (address, gate, pets, bi-weekly or monthly, last cut) to two questions (address, and what service they need). The CRM Notes field and the owner email notice were updated to match. The scenario stayed **active**.
- **Wording then (146 characters, one GSM-7 segment):**

  > Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) what service you need. Reply STOP to opt out.

- **Source:** Sisto asked for two questions to get the ball rolling and the rest after they accept (his words, Nov 10, 7:46 PM ET). He typed “Make it live, put it in…” at 8:04 PM ET. Proof passed the wording (after removing service examples he had not named) and later confirmed that live readback.
- **Status:** **Superseded** at 8:20:34 PM ET by the address + preferred-day (Tue–Sat) text above. Do not treat this service-question wording as the current live text. Snapshot kept for history: `make-scenarios/6671272_after_two_question_sms_20261110_modules.json`.

## 2026-11-08 — Customer_ID collision fix (live)

- **When:** Sunday, Nov 8, 2026, 6:04:55 PM ET.
- **What:** Live Make scenario **6246200** (LBT_Quote), module 2, Customer_ID generator was changed so two website leads in the same minute no longer get the same ID.
  - Before: `LC-{{formatDate(now; "YYMMDD-HHmm"; "America/New_York")}}`
  - After: `LC-{{formatDate(now; "YYMMDD-HHmmss"; "America/New_York")}}`
- **What did not change:** Existing customer rows were not rewritten. No other module, price, filter, or scenario changed. Two IDs generated in the same second can still collide.
- **Also on Nov 8 (not a live system change):** Sisto OKed customer-text wording (item 8 / `7-8 yes`) and approved sending those Lawns texts. That did not turn on go-live items 2–11 (ACCEPT pay links, offer-page deploy, live Stripe lawn prices, or the Job Done path).
