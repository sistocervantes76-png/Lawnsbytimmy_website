# Lawns by Timmy — automations and docs

This folder is a **sanitized** documentation bundle for the `sistocervantes76-png/Lawnsbytimmy_website` repository. Webhook URLs, Make connection and hook IDs, data-store IDs, spreadsheet IDs, API keys, account emails other than info@lawnsbytimmy.com, Stripe customer and account IDs, and customer CRM row data have been replaced with placeholders.

It was staged on the box on Tuesday, Nov 10, 2026 (America/New_York) so it can go into a later pull request. **This staging step did not clone the repo, open a pull request, push anything, or change any live system.**

## What the automations are

Lawns by Timmy’s lead and quote path runs in Make, with texts sent through RingCentral. The wording lives in Make, not in a RingCentral template. Owner alerts go to info@lawnsbytimmy.com.

- **Missed-call text-back (Make 6671272) — live.** When a caller misses the Lawns line ((954) 880-3500), this scenario can send one automatic text, add a New Lead row, and email the owner. As of **Tuesday, Nov 10, 2026, 8:20:34 PM ET**, the first text asks only two things: address, and which day works best (Tue–Sat). That is Sisto’s choice, and Proof’s readback of the live change was a PASS. Exact live wording (155 characters, one text segment):

  > Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) which day works best (Tue-Sat). Reply STOP to opt out.

  The 8:07:25 PM ET first text that asked for address and what service they need is **superseded** and is no longer live. The older five-question text is also retired.

- **Text replies + STOP (Make 6691639) — live.** Handles inbound texts: STOP / opt-out first, opt back in, ratings, and other replies. A generic reply today only emails the owner. It does **not** yet send a pay link when someone texts ACCEPT.

- **Website quote (Make 6246200) — live.** The lawnsbytimmy.com quote form posts here. It still prices the job from lot size and how often the lawn is mowed, writes a Customers row, and can email and text the quote. The public form has **not** been changed yet. Sisto picked **Option B** at 8:39 PM ET in Proof's chat (relayed by Proof): keep yard size and frequency for the instant price, and add the Tue–Sat day. His 8:32–8:33 PM ET Option A answers in Lawns chat are **superseded**. The Option B apply plan is pending Proof's check. Nothing has been applied.

- **TEST ACCEPT / Job Done clones — not live.** Test-only Make copies (6918616 ACCEPT, 6918610 Stripe events, 6918620 Job Done, 6918627 quote) stay switched **off**. A small test service (`flow-server.mjs`) on the box can log texts and use Stripe test keys only. On the live system, ACCEPT still only emails info@lawnsbytimmy.com. There is no installed customer mobile app. Existing customers can use the website My Account page at lawnsbytimmy.com/account (texted code sign-in), including a “Need something?” option to update gate / pet / access notes. Missed-call leads cannot sign in there until they are a real customer with an LC- ID. After they accept, remaining questions would be asked by ordinary text to the Lawns number, once that step is turned on.

## What’s live vs TEST

| Piece | State as of Nov 10, 2026, 8:20:34 PM ET |
|---|---|
| 6671272 missed-call first text (address + preferred day, Tue–Sat) | **Live** (Sisto’s choice; Proof readback PASS) |
| 8:07 PM ET “address + what service you need” first text | **Superseded** — no longer live |
| 6691639 STOP / opt-in / generic replies | **Live** (ACCEPT pay-link route is not on) |
| 6246200 website quote and price texts/emails | **Live** (Customer_ID now includes seconds, from Nov 8). Form not yet changed. |
| After-accept questions (gate, pets, how often, last cut) | Drafted; **not live** |
| Website form change to Option B (keep lot size + frequency for instant price; add required Tue–Sat day; move gate and pets after accept) | **Chosen direction** (Sisto, 8:39 PM ET in Proof's chat, relayed by Proof). 8:32–8:33 PM ET Option A answers are superseded. Exact apply plan pending Proof's check. Not applied, no PR, not deployed. |
| Offer / pay page and `flow-server.mjs` | **TEST build only**, not what the public site serves |
| Live Stripe lawn prices, live pay links, Job Done charges | **Not live** — still go-live work |

RingCentral does not need its own wording change for the missed-call text. Make sends the words through RingCentral.

## Website plan (Option B chosen; exact apply plan pending Proof's check)

The earlier A/B plan (`playbooks/lawns-website-two-question-plan-2026-11-10.md`, sha256 starting `de5d2ad2`) was revised after the 8:20 PM ET live text so “follow suit” means address + preferred day (Tue–Sat), not a service field. Proof rechecked that draft Tuesday, Nov 10, 2026, 8:26 PM ET: **PASS**, no required fixes.

Sisto first answered in Lawns chat at **8:32–8:33 PM ET** (card answers, relayed by Lawns) with Option A (contact, address, Tue–Sat day, no auto-price). Those answers are **superseded**. At **8:39 PM ET** he picked **Option B** on Proof's card in Proof's chat, relayed by Proof: **"B: keep yard size and frequency for the instant price, add the Tue-Sat day."** Lawns could not see the card pick itself in the transcript; Proof's 8:39 PM ET message to him states the switch from A to B.

Under Option B the form keeps contact info, address, lot size, and frequency so the instant price stays; adds a required day field (Tue / Wed / Thu / Fri / Sat) mapped into **Service_Day (column 20)** and the owner email; and moves gate and pets off the form until after they accept.

The exact apply plan is `playbooks/lawns-website-option-b-apply-plan-2026-11-10.md`. It is a draft only, **pending Proof's check**, then Sisto's OK on the live change, before any website PR or 6246200 patch. The Option A plan (`playbooks/lawns-website-option-a-day-plan-2026-11-10.md`) is shelved as history and must not be applied. The earlier A/B draft (`de5d2ad2…`) is left unchanged. Nothing on the site or in 6246200 has been changed. No PR has been opened.

**Service_Day already has values.** It is not written by the three live scenarios (6246200, 6671272, 6618999), but five Active Recurring customers already have Wed or Thu in that column. Later rows are blank. Mapping new preferred-day answers there would not overwrite those five, because 6246200 only appends a new row. The abbreviated weekday form matches the plan (Tue, Wed, Thu, Fri, Sat).

Until the after-accept step is live, dropping gate and pets from the form means new website leads would not have those answers collected automatically.

## Go-live items 2–11 (still open)

Item 1 is done: the customer-text wording was OKed, and sending those Lawns texts was approved (Nov 8). That approval does **not** turn on items 2–11. These still need Sisto’s yes, and a Proof check, before they go live:

2. Move the after-accept pay service into the Cloudflare Worker, then PR → Proof → merge and deploy only with Sisto’s yes.
3. Create the live Stripe products and prices (and the zone 2 $55 price on the offer Worker).
4. Point a live, signed Stripe webhook at the Worker.
5. Add CRM columns: Stripe_Customer_ID and Visits_Left on Customers, and a Job_Status dropdown on Jobs.
6. Back up, then update live 6691639 so STOP stays first, opt-in second, ACCEPT third, and ACCEPT can send the pay-link text.
7. Copy the TEST Stripe Events and Job Done scenarios to live versions that use the real tabs, with texts sent and Job Done running every 15 minutes.
8. Add the ACCEPT line to the live quote text and email in 6246200.
9. Finish offer-page customer tagging and the remaining phone/UI checks. Not deployed.
10. Make sure the RingCentral 10DLC campaign covers pay links and receipts, and register the domain for Apple Pay.
11. Proof check, one real low-dollar test with Sisto, then turn the TEST scenarios off for good and delete TEST tabs only with his OK.

## Change log of tonight’s work (Nov 10)

See [CHANGELOG.md](CHANGELOG.md) for dated entries. In short:

- At 8:07:25 PM ET the live missed-call first text in 6671272 was changed from five questions to address and what service they need. That version is **superseded**.
- At 8:20:34 PM ET it was changed again, to address and which day works best (Tue–Sat), after Sisto refined the two questions. Only that text, the CRM Notes field, and the owner email notice changed. Proof’s readback was a PASS. The scenario stayed active.
- A website plan to follow the same address + preferred-day questions was Proof-passed. Sisto's 8:32–8:33 PM ET Option A answers in Lawns chat were then **superseded** when he picked Option B at 8:39 PM ET in Proof's chat (relayed by Proof): keep yard size and frequency for the instant price, and add the Tue–Sat day. The Option B apply plan is pending Proof's check. It has not been applied.
- The other questions (gate, pets, how often, last cut) are still drafted for after someone accepts. That step is not live.
- This sanitized docs bundle was staged for a later pull request.

## The Proof-check rule

Proof checks every new change against its sources before it goes to Sisto, and before anything goes live. Do not apply a live Make, website, or Stripe change from these notes without that check and Sisto’s yes.

## What’s in this folder

- `playbooks/` — plans and playbooks (booking and payment, missed-call two-question plan with Applied v2, the earlier website A/B plan left unchanged, the Option B apply plan, the superseded Option A plan kept as history, test message-log drafts, teaching facts, homestead framing draft, area-offers scan, offer-launch and package-price notes).
- `proof-notes/` — Proof check requests, results, and apply/readback notes, including the 8:20 PM ET address-day apply and the website plan recheck.
- `make-scenarios/` — sanitized JSON snapshots of Make 6671272 (five-question baseline; 8:07 PM service-question **superseded**; 8:20 PM Tue–Sat **current**), 6691639 (latest backup), and 6246200 (Customer_ID fix before/after, plus the latest full snapshot). Scenario IDs, module structure, and SMS wording are kept. Connection, hook, data-store, and spreadsheet IDs are placeholders, so these files are for reading, not for re-importing as a live restore.
- `offer-page-test-build/` — sanitized copies of the TEST offer/pay page (`index.html`, `server.mjs`, `worker.js`, `flow-server.mjs`). **This is a TEST build, not deployed, and not what lawnsbytimmy.com serves today.**

## Sanitization

Placeholders you may see:

- `[REDACTED_MAKE_WEBHOOK_URL]` and `REDACTED_HOOK_TOKEN` — Make webhook URLs and path tokens
- `REDACTED_CONNECTION_ID`, `REDACTED_HOOK_ID`, `REDACTED_DATASTORE_ID`, `REDACTED_TEAM_ID`
- `REDACTED_SPREADSHEET_ID` — CRM spreadsheet IDs and sheet URLs
- `[REDACTED_ACCOUNT_EMAIL]` — account emails other than info@lawnsbytimmy.com
- `cus_REDACTED`, `acct_REDACTED`, `pi_REDACTED`, `price_REDACTED`, `prod_REDACTED`, `seti_REDACTED` — Stripe object IDs
- `/path/to/secrets/REDACTED` — secret file paths on the box

The public Lawns business number ((954) 880-3500), info@lawnsbytimmy.com, scenario IDs, module structure, and customer-facing SMS wording are kept on purpose.

## Secret scan (what was left on purpose)

A scan of this folder for webhook hostnames, Make hook URL paths, Stripe secret-key prefixes, webhook-signing and restricted-key prefixes, Gmail account addresses, phone-number patterns, and common key-field names found **no live webhook URLs, no Gmail addresses, no Stripe key values, and no webhook-signing or restricted-key values.**

These hits were left on purpose:

- **Lawns business phone** `(954) 880-3500` / `+19548803500` — public number, kept in SMS wording, owner emails, playbooks, and the test offer page.
- **Competitor quote** `(954) 520-6387` — appears only as a published offer quoted in the area-offers scan and Proof's check of that scan, not a Lawns customer number.
- **Stripe secret-key prefix guards** — the test build and playbooks say or check that live Stripe secret keys are refused. These are prefix strings, not keys.
- **Make error-type name** `InvalidAccessTokenError` — in 6691639 filter lists (module structure, kept).
- **Placeholder** `REDACTED_HOOK_TOKEN` — not a real hook path.
- **The ordinary word “webhook” plus a period** — one sentence-ending period in a proof note; not a webhook URL.
