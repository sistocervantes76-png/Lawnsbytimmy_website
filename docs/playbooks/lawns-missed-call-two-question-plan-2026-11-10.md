# Lawns missed-call two-question SMS plan
Date: Tuesday, Nov 10, 2026, 7:51 PM ET (America/New_York)
Status: **FIRST-TEXT APPLIED to live 6671272 only.** First apply Tuesday Nov 10, 2026, 8:07:25 PM ET (address + what service they need). **Applied v2** Tuesday Nov 10, 2026, 8:20:34 PM ET (address + preferred day, Tue-Sat). After-ACCEPT text and 6691639/6246200 were not changed. The scenario was not run. No SMS or email was sent by these applies.

**Source of the request:** Alexander relayed Sisto's own words from Alexander's chat, Tuesday Nov 10, 2026, 7:46 PM ET. Lawns has not independently read that typed turn. The quoted words:

> The mix scenario for the Lawns by Timmy CRM is for the missed-call text back. The questions we text them should be just two to get the ball rolling, and the rest should be asked when they accept the offer. We already have their phone number so we just need their address and what service they're looking for. That should be enough.

This plan is not approval to change live Make, to send texts, or to turn on ACCEPT. New wording is not covered by the Nov 8 item-8 wording OK or by Sisto's Nov 8 "the answer for Lawns is yes" (those applied to the Nov 7 quote / pay-link / receipt packet). Go-live list items 2–11 in `/workspace/playbooks/lawns-booking-payment-playbook.md` remain undone and still need his yes.

**Do not publish:** webhook URLs, connection IDs, keys, datastore IDs, or account emails. Backups of the raw Make configs exist on the box and contain those values; do not paste backup JSON into public notes.

---

## 1. Live backups taken (read-only)

Make `scenario_get` plus `scenario_module_get` for every module. Wrappers stripped to the first JSON object. Sidecar lists sha256 of both files. Taken Tuesday, Nov 10, 2026, 7:51 PM ET.

| Scenario | Live name | status (isActive) | lastEdit (ET) | Files + sha256 |
|---|---|---|---|---|
| 6671272 | LBT Missed Call Text-Back | active (yes) | Sun Oct 25, 2026, 12:12:19 PM ET | `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951_scenario.json` `1334a085ac412e61de372709aee8996aef4086d181237dd7e30657df631066d1` ; `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951_modules.json` `084b39e8b686b1bab44755e2473f4fd846ed120104d0343cf874b11c6854e663` ; sidecar `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951.sha256` |
| 6691639 | LBT Text Replies + STOP | active (yes) | Thu Nov 5, 2026, 2:25:34 PM ET | `/workspace/backups/make/6691639_before_two_question_sms_20261110_1951_scenario.json` `4b1103c4f08e9f5812ea1e9501ca9f118ed5574fe00fd403cc4bb0c4fdfe0d88` ; `/workspace/backups/make/6691639_before_two_question_sms_20261110_1951_modules.json` `a16c80cd54bb9dc7e7d042555c59fa7c7e479ed1023af2e35801aeb52f56b6be` ; sidecar `/workspace/backups/make/6691639_before_two_question_sms_20261110_1951.sha256` |
| 6246200 | LBT_Quote | active (yes) | Sun Nov 8, 2026, 6:04:55 PM ET | `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_scenario.json` `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667` ; `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_modules.json` `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008` ; sidecar `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951.sha256` |

6671272 lastEdit matches the Nov 8 teaching-facts inspect (unchanged since Oct 25). 6691639 lastEdit matches the Nov 8 teaching-facts inspect (still Nov 5, 2:25 PM ET). 6246200 lastEdit matches the Nov 8 Customer_ID-seconds fix readback.

Also inspected read-only, not part of the formal backup set: TEST clone 6918616 "TEST LBT Text Replies + ACCEPT (clone of 6691639 — test webhook, no SMS)". **status=inactive (OFF).** lastEdit Thu Nov 5, 2026, 2:29:36 PM ET.

---

## 2. What is live now in 6671272

### Exact first auto-text

- Module **4** `ringcentral:sendSMSMMS`
- Field: `mapper.text`
- Also mapped: `mapper.to[0].phoneNumber` = the normalized caller number from module 5; `mapper.phoneFrom` = the Lawns RingCentral number.

Exact live wording (copied from the Nov 10 modules backup):

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. For a fast quote, reply with: 1) Address 2) Is your back gate at least 36" wide? 3) Any pets? 4) Bi-weekly or monthly service? 5) When was it last cut? Reply STOP to opt out.

| Count | Value |
|---|---|
| Characters | 244 |
| Encoding | GSM-7 (plain ASCII) |
| Segments | 2 (concatenated GSM-7 uses 153 chars/segment; 244 > 160, so 2) |
| Special characters | Apostrophe in `Timmy's` is U+0027 (ASCII). The inch mark in `36"` is U+0022 (straight double quote). No smart quotes, no typographic apostrophe, no emoji, no GSM-7 extended characters. |

This matches the wording recorded in `/workspace/playbooks/lawns-missed-call-teaching-facts-2026-11-08.md`.

### Every place in 6671272 that encodes the asked questions

There is no `Questions_Asked` column. The five questions are written in three customer- or owner-facing fields. The opt-out data store (modules 6 GetRecord / 7 AddRecord) stores only `opted_out` and `last_texted_at` (overwrite by phone key); it does not list the questions. Filters do not mention the questions.

Customers-tab column indexes below are 0-based `mapper.values.N` keys, matched to the Nov 5 row-1 headers (Customer_ID, Date_Added, Status, First_Name, Last_Name, Phone, Email, Service_Address, City, Zip, Lot_Size, Frequency, Services, Price_Per_Visit, Monthly_Total, Access_Notes, SMS_Consent, Stripe_Subscription_ID, Agreement_Signed, Card_On_File, Service_Day, Next_Service_Date, Lead_Source, Notes, …). Headers were not re-read from the sheet on Nov 10.

| Module | Type | Mapper key | What it says today |
|---|---|---|---|
| 4 | ringcentral:sendSMSMMS | `mapper.text` | The 5-question SMS quoted above |
| 8 | google-sheets:addRow, tab **Customers** | `mapper.values.23` (Notes) | `Missed call {{5.call_time}}. Auto-text sent asking for address, gate, pets, bi-weekly/monthly, last cut.` |
| 9 | google-email:sendAnEmail (owner notice, after a successful first auto-text) | `mapper.content` | Includes the sentence: "They were texted the quick-quote questions (address, gate width, pets, bi-weekly or monthly, last cut)." |

Module 8 also writes, unchanged by this proposal: `values.0` Customer_ID `MC-{{formatDate(now; "YYMMDD-HHmm"; "America/New_York")}}`; `values.1` Date_Added; `values.2` Status `New Lead`; `values.5` Phone; `values.16` SMS_Consent `Reply only (called us)`; `values.22` Lead_Source `Missed Call`. Name, address, city, ZIP, lot size, frequency, services, and prices are left blank. The caller's later reply is **not** parsed back into those columns (live 6691639 only emails the owner for a generic reply).

Other 6671272 emails (module 20 auto-text failed; module 10 called again within 24h; module 11 opted out) do not list the five questions.

---

## 3. Draft first auto-text (not live)

Keep the live greeting ("Hi, this is Timmy's assistant at Lawns by Timmy!"), ask only (1) address and (2) what service they need, keep "Reply STOP to opt out", plain ASCII, aim for one GSM-7 segment (<=160).

The full live opening including "Sorry we missed you." plus "For a fast quote," plus "lawn mowing, tree work, or irrigation" does not fit in 160 characters. Primary keeps the full opening including "Sorry we missed you." and the examples, and tightens the question phrasing so it stays in one segment. Alternate drops "Sorry we missed you." and uses a slightly more natural "Reply with: 1) your address 2) the service you need …". A 2-segment version that also keeps "For a fast quote" and "lawn mowing" is possible if Sisto prefers the extra words over a single segment.

### Primary (recommended)

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply 1) address 2) service (mowing, tree work, or irrigation). Reply STOP to opt out.

| Count | Value |
|---|---|
| Characters | 156 |
| Encoding | GSM-7 (plain ASCII; apostrophe in `Timmy's` is U+0027) |
| Segments | 1 (<=160) |

### Alternate

> Hi, this is Timmy's assistant at Lawns by Timmy! Reply with: 1) your address 2) the service you need (mowing, tree work, or irrigation). Reply STOP to opt out.

| Count | Value |
|---|---|
| Characters | 159 |
| Encoding | GSM-7 (plain ASCII; apostrophe in `Timmy's` is U+0027) |
| Segments | 1 (<=160) |

Neither draft is approved or applied. Sisto picks the wording (or a revision) before any live change.

---

## 4. Moving the other four questions to after ACCEPT

The four questions to move: gate at least 36 inches wide; pets; bi-weekly or monthly; last cut.

### Live facts, verified against the Nov 10 backups

**Live 6691639** (active; last edited Thu Nov 5, 2026, 2:25:34 PM ET):

- Module types in the backup: incoming RingCentral messages, SetVariables, routers, data-store add, Google Sheet addRow (Feedback + Error Log only), and owner-notice email. **No** `ringcentral:sendSMSMMS` or any other outbound SMS module.
- Module 2 `kind` switch, after lowercasing/trimming and stripping `.` `!` `,` from stop/start words: stop words → `stop`; `start` / `unstop` / `yes` → `start`; first character 1–5 → `rating`; everything else, **including ACCEPT**, → `reply`. There is no `accept` case.
- Routes: STOP (module 4 data store + module 5 owner email); START / YES (module 6 data store + module 7 owner email; YES means opt back in, not accept a quote); rating (module 9 Feedback tab + module 10 owner email); normal reply (module 8 owner email only). No Customers-row update on any of these routes.
- This matches the teaching facts and the booking playbook: ACCEPT today only emails the owner.

**TEST 6918616** (inactive / OFF; last edited Thu Nov 5, 2026, 2:29:36 PM ET):

- Name states it is a test-webhook clone with **no SMS**.
- Module 2 `kind` **does** include `"accept" → "accept"`, after the same stop/start/yes words. YES is still `start`.
- Router order: STOP first, opt-in (START / UNSTOP / YES) second, ACCEPT third, normal reply fourth.
- The ACCEPT route does not send SMS inside this scenario. It reads TEST sheet tabs, POSTs to the box-only flow service `/api/accept`, and writes back TEST rows. The pay-link customer text is composed by that service (`/workspace/lawns-flow/flow-server.mjs`), not by a RingCentral module in 6918616. The go-live design (playbook item 6) is: when this is copied to live 6691639, send each `sms` item from the service through RingCentral.
- Temporary test host / tunnel used in that TEST module is not live and is not repeated here.

**Go-live list items 2–11** in the booking playbook are still not done. Item 1 (wording OK + sending approval for the Nov 7 packet) does not turn them on. Item 6 is the live 6691639 ACCEPT patch. Item 10 is 10DLC coverage for pay links and receipts.

**Live 6246200 pricing (conflict to flag, not to decide):**

- Module 5 builds `key` = first word of `lot_size` (lowercased) + `frequency` (lowercased, hyphens and spaces stripped). Example: `small` + `biweekly` → `smallbiweekly`.
- Module 6 `base` is a switch on that key. Known matches include `smallbiweekly` = 45, `smallmonthly` = 50 (60 in May–September), plus medium / large / xl / extra bi-weekly and monthly amounts. **Anything else, including a missing or unexpected frequency or lot size, yields `base` = 0.**
- Zone comes from ZIP (zone 2 adds a $10 trip). A priced quote is sent only when `zone` is not 3 **and** `base` > 0. Otherwise the customer gets the "no price yet / we'll confirm" path.
- **Frequency is required for an automatic price.** Gate width is not used in the price formula (it is written to Customers `Access_Notes` as `Gate: … in`, and appears on the owner notice). Pets appear only on the owner notice (`pets_secured`). Last cut is not used in 6246200 at all.
- Lot size is also required for an automatic price. Neither the live 5-question missed-call text nor these drafts ask for lot size. That gap already exists today.
- Missed-call flow 6671272 does **not** call 6246200. 6246200 is the website / form quote path. No change to 6246200 is required to shorten the missed-call first text.

**Conflict for Sisto (do not resolve in this plan):** If missed-call leads are later auto-quoted with the same formula as 6246200, frequency (and lot size) must be known **before** a price can be quoted. Moving frequency to after ACCEPT means they would be asked to accept an offer before frequency is on file, unless the offer is assumed bi-weekly, priced by hand, or quoted some other way. Gate, pets, and last cut do not block a 6246200-style price.

**Another timing conflict:** Until live ACCEPT is turned on (go-live item 6, still not done), the four moved questions would not be asked **anywhere live**. If 6671272 is changed now, new missed-call leads would be asked only address and service. Gate, pets, frequency, and last cut would be collected only after ACCEPT exists, or by Timmy asking by hand. Sisto should choose:

- **(A)** Change 6671272 now (after Proof + his OK). Leads arrive without gate / pets / frequency / last-cut in the first text. The four questions are not asked automatically until ACCEPT is live.
- **(B)** Change 6671272 only together with ACCEPT go-live (item 6), so the first text and the after-ACCEPT text start on the same day.

Website / form leads already send frequency (default bi-weekly), gate width, and pets in the quote payload. If an after-ACCEPT questions SMS is added to the shared ACCEPT path, form leads could be asked again for answers already on file. Recommended: send the four-question SMS for missed-call leads (Lead_Source "Missed Call", or blank gate/frequency), and skip it when those fields are already filled. That is a design choice for Sisto, not a live change.

### Proposed after-ACCEPT SMS

Send it as a **second SMS immediately after** the pay-link text, not appended to the pay-link text. The approved pay-link draft (Nov 7 packet, wording OKed item 8) is already about two GSM-7 segments once a URL and name are filled in. Combining both would make a long mixed CTA (pay vs. answer questions) and would still leave 10DLC / sequence questions.

Draft after-ACCEPT text (plain ASCII, "36 inches" not `36"`, one segment):

> To finish booking, reply: 1) Is your back gate at least 36 inches wide? 2) Any pets? 3) Bi-weekly or monthly? 4) When was it last cut? Reply STOP to opt out.

| Count | Value |
|---|---|
| Characters | 157 |
| Encoding | GSM-7 (plain ASCII; no apostrophe, no inch mark, no emoji) |
| Segments | 1 (<=160) |

This wording is new. It is not in the Nov 7 packet and is not covered by the Nov 8 wording or sending approvals.

### 10DLC and sequence with the pay link

- Two outbound SMS in one ACCEPT handling: (1) the already-drafted pay-link text, (2) this questions text right after it.
- Keep "Reply STOP to opt out" on both. Do not send either if the number is opted out (STOP remains first in the router).
- Go-live item 10 already requires the RingCentral 10DLC campaign to cover pay links and receipts, and domain registration for Apple Pay. Adding a second transactional SMS in the same burst should be confirmed against that campaign (allowed content, throughput, and URL / phone-number registration). Do not assume item 10 is done; it is not.
- Rapid back-to-back SMS can look like a sequence to carriers. Keep both short (this questions text is one segment; the pay-link text is already longer) and do not add a third auto-text in the same moment.
- The TEST clone itself still has no RingCentral send; TEST logging today is to TEST_Msg_Log / the flow service. Live sending would appear only when item 6 is applied to 6691639.

### Where replies would be captured

Live today, a reply that is not STOP / YES / a 1–5 rating is kind `reply` and only emails the owner. Nothing is written to Customers.

Proposal (TEST first, then live with item 6): treat the next inbound text after ACCEPT (still excluding STOP, YES/start, and a new ACCEPT) as a booking-details reply. Append the raw reply to Customers **Notes** (column 23) so nothing is lost. Where later clearly mapped, also fill **Access_Notes** (15) for gate and pets, **Frequency** (11) for bi-weekly or monthly, and a last-cut note in Notes. Do not invent a parser in this draft; the first build should store the raw text, then add structured mapping after a Proof check.

A related gap, already true today and still true if only the first SMS wording changes: the caller's reply to the missed-call text (address and service, or today's five answers) is **not** written into Service_Address (7) or Services (12). Timmy sees it in RingCentral and in the owner email. Parsing the first reply into those columns is useful but is a separate piece; it is not required to shorten the first text.

---

## 5. Change list (order, backup-first, Proof-before-live)

Nothing below is authorized to be applied by this document.

0. **Already done (this work):** read-only backups of live 6671272, 6691639, and 6246200, with sha256 sidecars, dated Nov 10, 2026, 7:51 PM ET. No writes to Make.
1. **Proof** checks this draft wording and change list against those backups (request: `/workspace/proof-notes/lawns-missed-call-two-question-check-request-2026-11-10.md`). Lawns does not patch anything on a FAIL, and does not patch on a PASS until Sisto says yes.
2. **Sisto decides:** (a) primary vs. alternate first-text wording, or a revision; (b) the after-ACCEPT wording; (c) timing option A (change 6671272 now) vs. B (together with ACCEPT go-live); (d) the pricing / frequency conflict (do not auto-decide); (e) whether form leads should be skipped for the four-question SMS when gate/frequency are already on the row. This decision is not the Nov 8 sending yes.
3. **Re-backup immediately before any future patch** (live or TEST), even though a Nov 10 baseline exists. Diff the new snapshot to these hashes first.
4. **TEST only, after Proof + Sisto yes on the plan** (still no live patch, no real customer SMS):
   1. Backup TEST 6918616 and the flow service file before editing.
   2. In the flow service (where the ACCEPT pay-link `sms` item is composed), add the after-ACCEPT questions SMS as a second `sms` item after the pay-link text. 6918616 stays without a direct RingCentral send, matching today's TEST design.
   3. Add capture of the follow-up reply onto TEST_Customers (at least append to Notes; optionally Access_Notes and Frequency).
   4. Optionally skip the questions SMS when TEST_Customers already has frequency / access notes (form-lead case), if Sisto chose that.
   5. Update the TEST message-log draft packet with the new first-text and after-ACCEPT lines, clearly marked as new wording.
   6. Proof checks the TEST change against the TEST backup. Then one test on Sisto's phone or a designated test number only.
5. **Live 6671272**, only after Proof PASS of the planned field edits **and** Sisto's yes to go live on this wording, and only if he picked option A or has also approved pairing it with item 6:
   1. Re-backup 6671272.
   2. Patch module 4 `mapper.text` to the approved first auto-text. Touch no other mapper keys on module 4.
   3. Patch module 8 `mapper.values.23` (Notes) so it no longer says the auto-text asked for gate, pets, bi-weekly/monthly, and last cut. Suggested replacement: `Missed call {{5.call_time}}. Auto-text sent asking for address and what service they need.` Do not change other `values.*` keys, the sheet, or the tab.
   4. Patch module 9 `mapper.content` so the owner notice matches (the sentence that currently lists "address, gate width, pets, bi-weekly or monthly, last cut").
   5. Read back all three modules from live. Diff against the pre-change backup. Only those three fields may change. Connections, filters, data-store fields, and the 24-hour / opt-out branches stay as they are.
   6. Update `/workspace/playbooks/lawns-missed-call-teaching-facts-2026-11-08.md` (or a dated successor) so Fork/Fox teaching facts are not left describing the old 5-question text. Update only after the live wording actually changes.
6. **Live 6691639 ACCEPT + questions SMS** is **go-live item 6**, not part of a 6671272-only wording change:
   1. Re-backup 6691639.
   2. Keep STOP / opt-out first, opt-in (start / unstop / yes) second, ACCEPT third, then the rest. YES stays opt back in.
   3. RingCentral send for each `sms` item from the service, including the pay-link text and the new questions text, plus owner alerts. Copy the reply-capture to the live Customers tab.
   4. Proof, then Sisto's yes to turn that route on. Items 2–5 and 7–11 stay their own work.
7. **6246200:** no change for this question move. Do not add the four questions to quote SMS modules 9/10 or to quote emails. If Sisto later wants missed-call leads auto-quoted through this scenario, that is a separate design and must face the frequency / lot-size requirement above.
8. **Out of scope / must stay unchanged unless Sisto later says otherwise:** live Stripe, the offer page, Job Done, TEST scenario on/off state (6918616 stays OFF until a later test plan), sending any customer SMS from this work, and teaching-facts updates before the live text actually changes.

### Live vs TEST-only (summary)

| Piece | State now |
|---|---|
| 6671272 first auto-text (5 questions) | Live, active |
| 6671272 Customers Notes / owner notice that list those 5 questions | Live, active |
| 6691639 ACCEPT → pay link | Not live. ACCEPT emails the owner only. No outbound SMS |
| 6691639 Customers-row reply capture | Not live (generic reply is email only) |
| After-ACCEPT four-question SMS | Not built anywhere, including TEST |
| 6918616 ACCEPT route + flow-service pay-link text | TEST only, scenario OFF |
| 6246200 auto-price from lot size + frequency | Live, website/form path only |
| Playbook go-live items 2–11 | Not done |
| Teaching facts 5-question wording | Still accurate for what is live today; must be updated if 6671272 changes |

---

## 6. What this is not

- Not a live Make change.
- Not permission to send texts.
- Not ACCEPT go-live.
- Not a Proof PASS (request is separate).
- Not an independent read of Sisto's Nov 10 typed turn (Alexander-relayed only).

## Proof result (Tue Nov 10, 2026, ~7:56 PM ET)
FIX applied: drop the service examples (not in Sisto's words; site lists mowing only). Proof-passed first text (146 chars, GSM-7, 1 segment):
"Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) what service you need. Reply STOP to opt out."
Earlier primary/alternate drafts with "(mowing, tree work, or irrigation)" are superseded. Adding "For a fast quote," makes it 164 chars, 2 segments.
After-ACCEPT text: PASS as new wording; needs Sisto's OK. Conflicts confirmed and left to Sisto. Proof notes: /workspace/proof-notes/lawns-missed-call-two-question-check-2026-11-10.md
Nothing changed live; nothing sent.


---

## Applied (Tue Nov 10, 2026, 8:07:25 PM ET)

Sisto typed in Lawns chat (Tue Nov 10, 2026, 8:04 PM ET): "Make it live, put it in, and does the wording need to be changed in RingCentral." That was his OK to put the Proof-passed two-question first text live in 6671272 (timing option A). It is not OK to turn on ACCEPT, to send texts from here, or to change 6691639 / 6246200 / RingCentral.

Pre-check: fresh `scenario_get` + all-module read. `lastEdit` was still `2026-10-25T16:12:19.308Z` (Sun Oct 25, 2026, 12:12:19 PM ET). Modules 4, 8, and 9 matched the 7:51 PM backup (sidecar verified). Scenario was already active.

Patch: one `scenario_patch` on live 6671272 only, `expectedLastEdit` that Oct 25 value, three `module_config_set` operations sending each mapper domain complete. Only these fields changed:

- Module 4 `mapper.text` → the Proof-passed 146-character line (ASCII apostrophe U+0027, 1 GSM-7 segment).
- Module 8 `mapper.values.23` → `Missed call {{5.call_time}}. Auto-text sent asking for address and what service they need.`
- Module 9 `mapper.content` → the owner-notice sentence listing now reads `(address and what service they need)`; the rest of the email is unchanged.

Readback: scenario still **active**. New `lastEdit`: `2026-11-11T01:07:25.720Z` (Tue Nov 10, 2026, 8:07:25 PM ET). Full module diff vs the 7:51 PM backup showed only those three fields. After-snapshot: `/workspace/backups/make/6671272_after_two_question_sms_20261110_modules.json` sha256 `e4b4b29c59ca2cf3ef6ead2172d2db0bfaab3d35fc7d28b1e3e11293a7dd6cdc`.

RingCentral: the missed-call SMS is sent by Make module 4, type `ringcentral:sendSMSMMS`, from an inline `mapper.text` (no RingCentral template id). Nothing in the scenario references a RingCentral-side template or auto-reply. RingCentral itself was not inspected or changed. The wording for this flow lives in Make, so no RingCentral-side wording change was required for this go-live.

Not done in this apply (still as planned): after-ACCEPT four-question SMS, live 6691639 ACCEPT, any 6246200 change, TEST clones, Stripe, the website, a scenario run, or sending any text. Until ACCEPT is live, the four moved questions are not asked automatically anywhere.

Apply notes: `/workspace/proof-notes/lawns-missed-call-two-question-apply-2026-11-10.md`. Teaching facts updated to the new live text.


## Applied v2 (Tue Nov 10, 2026, 8:20:34 PM ET)

Sisto refined the two questions in Proof's chat the same evening, after the 8:07 PM ET apply. Lawns did not independently read those typed turns; Proof reported them and gave the exact lines to apply:

- 8:16 PM ET: "address and when thjey would like it done"
- 8:17 PM ET: "Yes, put the address + when text live" (148-character "address + when you'd like it done" draft)
- 8:18 PM ET: preferred day, Mon-Fri
- 8:19 PM ET: "tuesday thru saturday is better"

Neither the 148-character "when you'd like it done" text nor the Mon-Fri preferred-day text was written live. Only the final Tue-Sat wording below was patched. Sisto's earlier 8:04 PM ET "Make it live, put it in" still stands as the go-ahead for this missed-call first-text change. This is not OK to turn on ACCEPT, to send texts from here, or to change 6691639 / 6246200 / RingCentral / the website.

Pre-check: fresh backup `/workspace/backups/make/6671272_before_address_day_sms_20261110_2019_{scenario,modules}.json` (sidecar verified). `lastEdit` was still `2026-11-11T01:07:25.720Z` (Tue Nov 10, 2026, 8:07:25 PM ET). Modules 4, 8, and 9 (and every other module) were equal to `/workspace/backups/make/6671272_after_two_question_sms_20261110_modules.json`. Scenario was already active.

Patch: one `scenario_patch` on live 6671272 only, `expectedLastEdit` that 8:07:25 PM ET value, three `module_config_set` operations sending each mapper domain complete. Only these fields changed:

- Module 4 `mapper.text` (155 characters, ASCII/GSM-7, 1 segment; apostrophe in `Timmy's` is U+0027; hyphen in `Tue-Sat` is U+002D):

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) which day works best (Tue-Sat). Reply STOP to opt out.

- Module 8 `mapper.values.23` → `Missed call {{5.call_time}}. Auto-text sent asking for address and preferred day (Tue-Sat).`
- Module 9 `mapper.content` → only the listing was replaced, now `(address and preferred day, Tue-Sat)`; the rest of the email is unchanged.

Readback: scenario still **active**. New `lastEdit`: `2026-11-11T01:20:34.505Z` (Tue Nov 10, 2026, 8:20:34 PM ET). Full module-config diff vs the 8:19 PM ET pre-change backup showed **exactly those three fields**. Scenario envelope differed only in `lastEdit`. After-snapshot: `/workspace/backups/make/6671272_after_address_day_sms_20261110_modules.json` sha256 `f4335285c15d16864232d7e62f45c9ce2d0743201809b708ce36cc12cde588a5`.

Backup hashes (sidecar `/workspace/backups/make/6671272_before_address_day_sms_20261110_2019.sha256`, `sha256sum -c` OK):

- modules `e4b4b29c59ca2cf3ef6ead2172d2db0bfaab3d35fc7d28b1e3e11293a7dd6cdc` (identical to the 8:07 PM ET after-snapshot, as expected)
- scenario `c2623018b65eb43286045f8dbf0665593b960df58a5440da06109ad58d770b0f`

Not done in this apply: after-ACCEPT questions SMS, live 6691639 ACCEPT, any 6246200 or website change, TEST clones, Stripe, RingCentral, a scenario run, or sending any text. The service question is no longer in the live first text. Until ACCEPT is live, gate, pets, bi-weekly or monthly, and last cut are still not asked automatically anywhere.

The website plan was revised after this readback so "follow suit" means address + preferred day (Tue-Sat), not a service field. See `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md`.

Apply notes: `/workspace/proof-notes/lawns-missed-call-address-day-apply-2026-11-10.md`. Teaching facts updated to the new live text.
