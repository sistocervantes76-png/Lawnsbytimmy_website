# Lawns by Timmy: Offer, Booking and Payment Playbook

Written Nov 5, 2026, 12:35 PM ET. Checked against the real system. Anything marked **UNVERIFIED** I could not confirm by reading the system itself.

**Reviewed by Proof, Nov 5 2026 12:36 PM ET.**

## 1. The customer's path (one phone screen)

1. **Offer shows right away.** Headline: **"Your first cut is $19"** with the package subline right under it: the 4-visit bi-weekly package is **$154 up front** ($19 first, then 3 at $45). Secondary choice on the same card: **$45 / visit, bi-weekly** ($55 in zone 2 ZIPs 33301, 33304, 33305, 33306, 33308, 33313, 33316, once the customer's ZIP is known; Sisto, Nov 7). The page always shows: "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service." The page also says recurring bi-weekly only (not one-time cuts), catch-up quoted separately, and small yard = up to 5,000 sq ft.
2. **3 fields.** Name, mobile, and address with ZIP.
3. **Get a Quote.** Sends the lead (see section 2), then opens payment on the same page.
4. **Pay.** This is Stripe's real card form (the Payment Element). **Default selection is the 4-visit package ($154)** so it matches the headline. Due today shows **$154** with the line **"4-visit package · $19 first, then 3 at $45"**. The customer can one-tap uncheck the package for **$45 / visit** ($55 in zone 2) instead (total updates). The server, not the browser, picks $45 or $55 from the ZIP. The $154 package is the same in every zone. Also on this screen:
   - Package rules: recurring bi-weekly only; visits can't be split or used as one-time cuts; cancel early → unused visits become account credit (no cash refund).
   - A "Save my card for recurring visits (optional)" checkbox.
   - A "Not ready? We'll email your quote" option.
5. **Paid screen.** Shows the amount and the card. Also has "Or book a free estimate", which links to https://calendar.app.google/cEtwcki68DJwSfv89
6. **My Account.** Filled with the customer's real name, address, plan, price and card.

Files are in `/workspace/lawns-offer-page/`:
- `index.html`: the page. Its settings are in CONFIG.
- `server.mjs`: the local test server. It creates the Stripe PaymentIntent and saves the card.
- `worker.js` and `wrangler.toml`: the Cloudflare Worker for going live.

`worker.js` now uses the same flow as `server.mjs`: Customer, then PaymentIntent, then Payment Element.

**Heads-up:** `worker.js` and `server.mjs` both still **refuse sk_live_ keys** by design. Going live means a deliberate change to that guard, approved by Sisto.

## 2. Where the lead goes

**Payload** (built in `index.html` and seen in `mock-leads.jsonl`):

```
{ event:"lead_form_submitted", timestamp, source:"offer-page", offer_id,
  lead_data:{ first_name, last_name, phone, sms_consent:true, email:"",
    lot_size:"Not sure", service_address, city, zip, gate_width_inches:null,
    pets_secured:false, frequency:"Bi-Weekly", add_ons:[], card_on_file_agreed:true,
    source:"offer-page", offer_id } }
```

`offer_id` is `small_yard_biweekly` or `prepaid_4_visits`.

**Now (test):** `USE_REAL_WEBHOOK: false`. Leads go to `/mock/lead`, which writes to `mock-leads.jsonl`. Make is never hit.

**Live:** the Make webhook `LBT_Quote_Hook` at [REDACTED_MAKE_WEBHOOK_URL]
- This URL is set in CONFIG.
- This hook belongs to scenario 6246200: **CONFIRMED** (Proof checked it with scenario_trigger_inspect).

**Make scenario LBT_Quote (id 6246200).** Active. Last edited Sun Nov 8, 2026, 6:04:55 PM ET (Customer_ID seconds). Previously edited Thu Nov 5, 2026, 12:55:09 PM ET. In order:
1. Webhook comes in, then two "set variables" steps that work out the zone and the base price.
2. **Add row to the CRM sheet**, only if the lead is real: it has an email with "@", or a phone with 10+ digits.
3. Replies to the webhook, then sends an email to info@lawnsbytimmy.com (module 4).
4. Router with 4 paths:
   - Email with a price (zone isn't 3 and base > 0): quote email.
   - Email with no price (Zone 3, or base = 0): "no price yet" email.
   - Text OK with a price: priced SMS through RingCentral "Lawns by Timmy".
   - Text OK with no price: **"no price yet" SMS**. This goes out when sms_consent = true and Zone 3 or base = 0.
5. Every send has an error email as a backup.
6. All connections show "ok".

**Note:** the page sends `email:""` and `lot_size:"Not sure"`. So a lead from this page will most likely get the **no-price SMS** and no email. That's expected for now.

**Text replies** are handled in Make scenario **'LBT Text Replies + STOP' (6691639)**, module 2.
- **ACCEPT: built and tested in TEST only (Nov 5, 2:07 PM ET), NOT live.** See section 10. Sisto, in Lawns chat, Nov 5 2026 ~12:58 AM ET: 'When a quote comes in, they get a text back with the amount... they can accept and pay for it or put their card on file to pay when it's done', and he picked 'Send the payment link right away when they reply ACCEPT.' Today nothing sends a link. ACCEPT falls through to the generic "reply" kind, which only emails info@lawnsbytimmy.com. **Customer-facing SMS wording is OKed (item 8), and sending those Lawns texts is approved (Sisto in Proof's chat, Nov 8: "the answer for Lawns is yes").** Live 6691639 is still unchanged, so ACCEPT still only emails info@lawnsbytimmy.com. Turning that route on, deploying the offer page, creating live Stripe lawn prices, and copying the Job Done path live still need to be checked, and he still needs to say to go live on those pieces.
- **YES:** maps to "start", which opts the customer back in after STOP. Correct as a rule.

**Make price (FIXED Nov 5, 12:55 PM ET):** LBT_Quote module 6 now has small bi-weekly (up to 5,000 sq ft) at **$45** in zone 1, and **$55** in zone 2 (+$10 trip fee). Sisto approved it at 12:49 PM and Proof passed it. The old $40 config is backed up at `backups/lbt_quote_6246200_2026-11-05.json`.

**CRM sheet** `REDACTED_SPREADSHEET_ID`, tab **Customers**. I read the headers only:
Customer_ID, Date_Added, Status, First_Name, Last_Name, Phone, Email, Service_Address, City, Zip, Lot_Size, Frequency, Services, Price_Per_Visit, Monthly_Total, Access_Notes, SMS_Consent, Stripe_Subscription_ID, Agreement_Signed, Card_On_File, Service_Day, Next_Service_Date, Lead_Source, Notes, Last_Updated, Route_Pocket, Next_Action, Follow_Up_Date, Last_Visit, Payment_Method.

## 3. Stripe

**Live account:** `acct_REDACTED` "Lawns by Timmy", livemode = true. This is the only account the Stripe connector sees. It's read-only for us: never change it.

**Test sandbox:** `acct_REDACTED` "Lawnsbytimmy" (checked through the API with the test key).
- Keys are at `/path/to/secrets/REDACTED` (sk_test_) and `/path/to/secrets/REDACTED` (pk_test_). Never print them.

**Active test prices:**

| What | Price ID | Amount | Product |
|---|---|---|---|
| Small-yard bi-weekly mow | `price_REDACTED` | $45.00 | prod_REDACTED |
| 4-visit mow package | `price_REDACTED` | $154.00 | prod_REDACTED |

- Both prices have metadata `recurring_only=true` and `source=sisto-2026-11-05`, plus the recurring-only note.
- The $1 and $2 placeholder prices are archived (inactive).
- **Also in this sandbox:** 3 active prices that look like Fork & Algorithm ("Founding Member" $49, "Full Membership" $99, "subscription" $7). They're from the sandbox's starting setup. See the issue log. They are not used by the Lawns page.

**Tested payments (Nov 5, test mode):**
- $45, `pi_REDACTED`: succeeded, card saved.
- $154, `pi_REDACTED`: succeeded, card saved (`setup_future_usage=off_session`).

## 4. Prices (from Sisto, Nov 5, 2026)
- Small-yard bi-weekly mow: **$45 per visit**.
- 4-visit package: **$154 paid up front**. That's the first visit at $19, then 3 at $45.
- Recurring bi-weekly service only. Package visits can't be split or used as one-time cuts.
- The $19 first visit does **not** replace the catch-up fee. Lawns not cut in over 10 days get a one-time catch-up fee, charged on top.

## 4b. Conflicts with the live site
- The FAQ says payment is charged **after each visit**. That conflicts with the $154 prepaid package.
- The hero says **"Every Week"**, but the offer is **bi-weekly**.

Both need Sisto's call before go-live.

## 5. Booking page
https://calendar.app.google/cEtwcki68DJwSfv89. It's linked on the paid screen.
- 30-min in-person estimates, **appointments 1–4:30 PM ET**. Proof saw slots starting at 1, 2, 3 and 4 PM; the last one ends at 4:30 PM.
- Mon–Sat only, and max 4 a day: **UNVERIFIED**.

## 6. Website
- GitHub repo `sistocervantes76-png/Lawnsbytimmy_website`.
- Hosted as a **Cloudflare Worker with assets** (`lawnsbytimmy-website`, `wrangler.jsonc`). It is **not** Cloudflare Pages.
- Business phone: (954) 880-3500.
- "PR only, no merge without Sisto's yes" is a **working rule, not enforced**: branch protection is off on `main`.

## 7. Standing rules
- **Proof** checks every new change against its sources before it goes to Sisto, and before anything goes live.
- Emails are drafts only. Nothing sends without Sisto.
- Nothing goes live, deploys, or touches the real webhook or live Stripe without Sisto's OK.

## 8. Test it from your phone
1. Run `node server.mjs` in `/workspace/lawns-offer-page`, plus a quick tunnel (cloudflared).
2. Open the tunnel link with `?mock=1`.
3. Card: `4242 4242 4242 4242`, expiry 12/30, CVC 123, ZIP 33334.

The tunnel link is **temporary**. The last one (`tribes-williams-drink-nextel.trycloudflare.com`) stopped at about 12:31 PM ET on Nov 5. Each run makes a new link.

## 9. Go-live checklist
1. Create the real **live** Stripe prices ($45, $55 zone 2, $154, $139 renewal; lookup keys in section 10) with Sisto's OK.
2. Settle the sk_live_ guard in `worker.js` with Sisto. Settle the site conflicts in section 4b.
3. Put the live pk and sk in the Worker secrets (`wrangler secret put`). Never put them in the code.
4. Set `USE_REAL_WEBHOOK: true`, and point `CREATE_SESSION_URL` at the Worker.
5. ACCEPT → payment link is built in TEST (section 10). Go live with it by following the section 10 go-live list, or remove any copy that promises it.
6. Proof check against this playbook.
7. Sisto's OK.
8. PR, then merge (only on Sisto's yes), then deploy.
9. One real phone test after it's live.

## 10. Quote → paid → done → paid-complete (built and tested in TEST, Nov 5, 2026, 1:50–2:20 PM ET)

Nothing in this section is live. No live Make scenario was edited. No real text went out. Stripe was TEST only.

### Sources for ACCEPT auto-link and per-visit card saving
- Sisto's own words in Lawns chat (searchable transcript, position 42): "...After that they can accept and pay for it or put their card on file to pay when it's done." This free-text quote is the main source.
- Lawns-reported (the card pick itself is not in the searchable transcript; only Lawns' "Got it" afterward is searchable): he picked the option "Send the payment link right away when they reply ACCEPT." (around 12:58 AM ET, Nov 5, 2026).

These cited words support saving a card for per-visit service and charging it after the job, as well as accepting/paying up front. They do not by themselves establish every implementation detail (including requiring a card or the precise Completed-trigger mechanism).

**Zone 2: DECIDED by Sisto, Sat Nov 7, 2026** (his words, via Alexander's card): "Show $55 per visit in those Fort Lauderdale ZIPs, keep the $154 package everywhere, and add that some ZIPs add a $10 trip fee to per-visit service."
Applied in TEST on Nov 7 (~3:45 PM ET):
- offer page `index.html` and `dist/index.html`
- `server.mjs` and `worker.js` (zone 2 per-visit charged at $55)
- `flow-server.mjs` (`ZONE2_PACKAGE_ENABLED=true`, pay-link 2a in every zone)
Proof check request: `/workspace/proof-notes/lawns-zone2-offer-update-check-request-2026-11-07.md`. Not live.

**Items 7 and 8: OKed.** Sisto typed `7-8 yes` in Alexander's chat on Sun Nov 8, 2026 (Alexander reported about 5:55 PM ET; that clock time was not independently dated). Lawns and Proof independently read that typed user turn. The list he was answering included item 7 (fix the live same-minute customer-ID glitch after a backup) and item 8 (OK the customer text and consent wording; drafts written, nothing sent).
- Item 7: Applied and read back Sun Nov 8, 2026, 6:04:55 PM ET. Live 6246200 (LBT_Quote) is still active. Module 2 Customer_ID is now `LC-{{formatDate(now; "YYMMDD-HHmmss"; "America/New_York")}}`. A full config diff against the pre-change backup (`/workspace/backups/make/6246200_before_customer_id_fix_20261108_modules.json`, sha256 `c3d325f1f15c182529a210a5b404be7cfc9335cf7388efd95e073b9d96e00df9`) showed only that formula changed (`HHmm` -> `HHmmss`). Module 6 prices and zone 2 were unchanged (small bi-weekly $45; zone 2 is $55 via a +$10 trip fee). Existing rows keep their old IDs. Two leads created in the same second can still share an ID. Proof PASS of the planned change: `/workspace/proof-notes/lawns-6246200-customer-id-collision-fix-check-2026-11-08.md`. Proof PASS of the readback: `/workspace/proof-notes/lawns-6246200-customer-id-collision-fix-readback-check-2026-11-08.md`. This scoped change is complete.
- Item 8: the customer text and consent wording in the Nov 7 draft packet (`/workspace/playbooks/lawns-test-msg-log-draft-packet-2026-11-07.md`) is OKed. That includes the ACCEPT pay-link line, "charged after each visit," and "Link good for 3 days" (the 72-hour link window).
- **Sending those Lawns customer texts: approved, Sun Nov 8, 2026, in Proof's chat** (Proof reported about 7:18 PM ET). After Proof said sending was not cleared — and had mixed Lawns texts with the Fork/Substack $47 offer — Sisto typed: "Talking about lawns then. You got two of them mixed up. There's lawn. You're talking about lawns and fork algorithm/substack the answer for Lawns is yes. After I hit Done it should catch them out." He also typed that those are two different situations and the question needed to be clearer. Lawns independently read those typed user turns. This updates the earlier item-8 wording-only OK: sending the Lawns texts in the Nov 7 packet is yes. It does not mix them with Substack or prospect emails. No texts were sent by this documentation update.
- **What this does not turn on:** live ACCEPT routing in 6691639, deploying the offer page, creating live Stripe lawn prices, or copying the Job Done charge/text scenarios live. Those remaining go-live pieces still need to be checked, and he still needs to say to go live on them. The Job Done path is still TEST-only, so marking a job Completed today will not yet send those texts or charge a card. 10DLC coverage for pay links and receipts is still a remaining go-live item. Zone 2 and prices are unchanged.

Team defaults (Alexander, Nov 7, 2026 ~3:39 PM ET — he said these follow existing rules unless Sisto later says otherwise; not heard from Sisto directly on these three):
- Auto-book the next visit 14 days after a completed paid job; do not book a next visit after a declined card.
- Keep catch-up and extras for Sisto to charge by hand.
- When a package hits 0 visits, hold and prepare the $139 renewal link rather than auto-charging.

### The flow
```
Lead (form / offer page)
  └─ LBT_Quote ─ CRM Customers row, Status "New Lead", Price_Per_Cut $45 (zone 1) / $55 (zone 2)
       └─ quote text … "Reply ACCEPT to book and get your secure pay link."   (wording OKed item 8; sending approved in Proof's chat Nov 8; live ACCEPT path not on)
Customer texts ACCEPT  (YES stays = opt back in)
  └─ Text Replies scenario: STOP/opt-out first, opt-in (start/unstop/yes) second, ACCEPT third, then other replies
       └─ service: phone → +1XXXXXXXXXX, newest CRM row for that phone, Status "Quote Accepted",
          link /p/<id> (TEST temporary host; 72 h / "Link good for 3 days" wording OKed item 8; sending approved in Proof's chat Nov 8; live pay-link path not on) → designed to send at once, no manual approval; not live
Customer opens link (phone page, Stripe Payment Element)
  ├─ Package $154 now ($19 first cut + 3 × $45), offered in zone 1 AND zone 2 (Sisto, Nov 7). Saving the card: optional checkbox.
  └─ Pay per visit $45 (zone 2 $55). Card must be saved; nothing charged today.
Stripe webhook (signed, deduped, business=lawns_by_timmy only)
  └─ CRM: Status "Active Recurring", Payment_Method, Card_On_File, Stripe_Customer_ID, Visits_Left,
     Payments row, Jobs row V1 "Scheduled" (date blank: Timmy sets it), receipt text
Timmy mows, sets Job_Status = Completed on the Jobs tab
  └─ Job Done scenario (live design: every 15 min)
       ├─ Package: Visits_Left 4→3→2→1→0, receipt "X visits left"; at 0: $139 renewal link (7 days), Status "Renewal Due"
       ├─ Per visit: charge saved card $45/$55 off-session, Payments row, receipt
       │    └─ declined (402 / requires_payment_method): job + customer "Payment failed", new pay link (7 days),
       │       alert to Sisto, next visit NOT booked until paid
       └─ next visit added +14 days (bi-weekly)
```

### How Sisto marks a job done
Open the CRM, **Jobs** tab, find the row, pick **Completed** in Job_Status (dropdown). That's it.
- Service_Date and Price_Charged are filled in already. Leave Price_Charged as is for a normal mow.
- If Price_Charged is changed to anything other than the saved price (catch-up, extras), the charge is **held**: Billing_Status "HOLD…" and Sisto gets an alert. Nothing is charged automatically.
- Rows that are not Stripe customers (cash/Zelle, Payment_Method not "Stripe card…") are skipped, so the existing Job Done Text scenario 6771610 keeps working for them.

### What was built (TEST)
| Piece | ID / place | State |
|---|---|---|
| TEST LBT_Quote (clone of 6246200) | Make 6918627, hook REDACTED_HOOK_TOKEN | OFF |
| TEST LBT Text Replies + ACCEPT (clone of 6691639) | Make 6918616, hook REDACTED_HOOK_TOKEN | OFF |
| TEST LBT Stripe Events → CRM | Make 6918610, hook REDACTED_HOOK_TOKEN | OFF |
| TEST LBT Job Done → Charge / Count Down | Make 6918620 (run on demand) | OFF |
| Logic service (stands in for the Cloudflare Worker) | /workspace/lawns-flow/flow-server.mjs, port 8770, temporary tunnel | box only |
| CRM test tabs | TEST_Customers (+ Stripe_Customer_ID AE, Visits_Left AF), TEST_Jobs (Job_Status dropdown), TEST_Payments, TEST_Msg_Log | in the live CRM file; real tabs untouched |

Stripe TEST prices (all metadata business=lawns_by_timmy):

| Lookup key | Amount | Price |
|---|---|---|
| lbt_visit_small_biweekly_z1 | $45 | price_REDACTED |
| lbt_visit_small_biweekly_z2 | $55 | price_REDACTED |
| lbt_pkg4_small_biweekly | $154 | price_REDACTED |
| lbt_pkg4_renewal | $139 | price_REDACTED |

Zone 2 package: offered (`ZONE2_PACKAGE_ENABLED=true`), per Sisto's Nov 7 decision. Zone 2 per-visit is $55. The pay page terms include "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service."

Backups before changes: Make blueprints and module configs in /workspace/backups/make/ (…_20261105-1351.json; TEST clones …-1421.json). CRM: Drive copy "BACKUP Lawns By Timmy CRM 2026-11-05 1400 ET (before payment-flow test)" (REDACTED_SPREADSHEET_ID) and /workspace/backups/lbt_crm_20261105-1355.xlsx.

### Test results
All passed. IDs and screenshots: /workspace/lawns-offer-page/proof/flow/README.md.
- Package: pi_REDACTED $154 → 4 visits counted down → renewal pi_REDACTED $139 → Visits_Left 4.
- Per visit: seti_REDACTED → pi_REDACTED $45 → pi_REDACTED $45; changed price → HOLD.
- Failed charge (4000 0000 0000 0341): pi_REDACTED 402 card_declined → "Payment failed" + retry link → paid pi_REDACTED → next charge on new card pi_REDACTED.
- Guards: duplicate event ignored; bad signature 400; non-Lawns event ignored; no key 401; re-run charged nothing twice.

### Go-live list (item 1 done; items 2–11 still need Sisto's yes)
1. Done: customer-text wording OKed (item 8 / `7-8 yes` in Alexander's chat, Nov 8) and sending those Lawns texts approved (Sisto in Proof's chat, Nov 8: "the answer for Lawns is yes"; "After I hit Done it should catch them out"). See section 10. This does not turn on items 2–11.
2. Port flow-server.mjs into the Cloudflare Worker (routes /p/:id, /api/accept, /api/stripe/webhook, /api/stripe/apply, /api/ack, /api/jobs/process; links, events and jobs in Workers KV; secrets via `wrangler secret put`). PR → Proof → merge and deploy only on Sisto's yes.
3. Create the live products and prices with the same lookup keys and business=lawns_by_timmy (not through any agent until Sisto says yes). The offer-page Worker also needs `STRIPE_OFFER_ZONE2_PRICE_ID` (the live $55 price) and optionally `STRIPE_OFFER_ZONE2_AMOUNT_CENTS` (defaults to 5500).
4. Live Stripe webhook endpoint to the Worker (payment_intent.succeeded, payment_intent.payment_failed, setup_intent.succeeded), pinned API version.
5. CRM: add Stripe_Customer_ID and Visits_Left columns to Customers; Job_Status dropdown on Jobs.
6. Back up, then patch 6691639: keep STOP/opt-out first, opt-in (start/unstop/yes) second, ACCEPT third, then the rest; keep opt-out enforcement intact; RingCentral send for each `sms` item; email alert for `alerts`.
7. Copy 6918610 and 6918620 to live versions pointing at the real tabs, with RingCentral sends; Job Done every 15 minutes.
8. LBT_Quote module 9 (text) and module 3 (email): add the ACCEPT line.
9. Local offer test and production artifacts now tag Customer and PaymentIntent creation with business=lawns_by_timmy and crm_customer_id when supplied. Not deployed. CRM-ID resolution and event-kind/plan integration still need end-to-end validation; no customer ID is invented. Requested new phone/UI regression remains pending (this executor has no browser subagent). API-only $154/4242 regression passed, pi_REDACTED.
10. RingCentral 10DLC campaign must cover pay links and receipts. Register the domain for Apple Pay.
11. Proof check, one real low-dollar test with Sisto, then turn the TEST scenarios off for good (they're off now) and delete TEST tabs only with Sisto's OK.

## Sources checked (Nov 5, 2026, America/New_York)
- 12:31 PM: `index.html`, `server.mjs`, `worker.js`, `wrangler.toml`, `README.md`, `stripe-test-ids.json`, `last-run.json`, `mock-leads.jsonl`, and the tunnel/server logs in `/workspace/lawns-offer-page`.
- 12:31 PM: Stripe test API `/v1/account` and `/v1/prices` (read-only, test key).
- 12:32 PM: Make `scenario_get` for 6246200 (read-only).
- 12:32 PM: Google Sheet Customers tab, row 1 only (read-only).
- 12:33 PM: Stripe connector, account list (read-only).
- 12:36 PM: Proof review, covering scenario 6691639, LBT_Quote module 4 and module 6, the hook trigger, the live site FAQ and hero, the calendar slots, the repo, and branch protection. Corrections applied. I re-checked `worker.js` on the box.
- 12:55 PM: Make module 6 read back after the $45 edit. Only that one number changed.
- 2:20 PM: section 10 written from the TEST run (Make executions, Stripe test API, CRM TEST tabs, service logs).

### Proof follow-up (Nov 5, 2026, 2:31 PM ET)
6918616 remains OFF. STOP and opt-in routes now precede ACCEPT, mirroring the source blueprint into TEST_Msg_Log only (no real datastore or emails). No run was made after this ordering change. All flow/offer services, temporary tunnels and Stripe listener are stopped. 6671272 has a first read-only baseline in /workspace/backups/make; two consecutive snapshots match, but there is no earlier baseline to establish a historical diff.
