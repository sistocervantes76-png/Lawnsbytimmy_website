# Proof check request: Lawns website two-question form plan
> **Status note (docs bundle, after 8:20:34 PM ET Nov 10):** This request described “follow suit” as address + what service they need. That first text is **no longer live,** and the website plan was revised to address + preferred day (Tue–Sat). See `lawns-website-address-day-recheck-2026-11-10.md` and `../playbooks/lawns-website-two-question-plan-2026-11-10.md`.

Date: Tuesday, Nov 10, 2026, 8:10 PM ET (America/New_York)
Status: **DRAFT AND A PLAN ONLY. NOT APPLIED. NO PR. NOT DEPLOYED.** No Make write. No website file was edited. No SMS or email sent. Do not publish webhook URLs, connection IDs, keys, datastore IDs, spreadsheet IDs, or account emails.

## Authorization / source

Sisto typed in Lawns chat, Tuesday Nov 10, 2026, 8:06 PM ET (t40u): "make sure the website follows suit also and the app that connects the customerss after they accept quote is it still at payload."

"Follow suit" means the lawnsbytimmy.com quote form should match the new two-question missed-call approach (address + what service they need up front; gate, pets, frequency, last cut after they accept). Related: `/workspace/playbooks/lawns-missed-call-two-question-plan-2026-11-10.md` and `/workspace/proof-notes/lawns-missed-call-two-question-check-2026-11-10.md`.

This request is not permission to change the site, to change 6246200, to open or merge a PR, to deploy, to send texts, or to turn on ACCEPT. Another executor was applying the live 6671272 wording change at the same time; this inspect did not touch Make.

## What to check

Plan: `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md`

Please PASS or FAIL the plan's **current field list**, **6246200 dependency claims**, **option A vs B descriptions**, and **recommendation** against the live homepage, GitHub `main`, and the Nov 10 6246200 backup. Do not treat a PASS as approval to apply anything.

## Sources to use (read-only)

**Live homepage** fetched this evening, Tuesday Nov 10, 2026:

- `https://lawnsbytimmy.com/` — HTTP 200, 28,181 bytes, sha256 `8183b85bb4117190d90dfbd3ad5ae37a4d26177e98868d9d101d7c241ee2ff8b`

**GitHub** `sistocervantes76-png/Lawnsbytimmy_website` branch `main`:

- HEAD `d6482556807a165aa38793dbfe93085c272e65cf`, Thursday Nov 5, 2026, 7:49 AM ET ("Add a Substack signup section above the homepage footer. (#13)")
- `index.html` blob sha `fceb4ff483c79f248bf2863cf67bf6aedc4068c4`, size 28,181 bytes (plan says this matches the live form)

The box clone `/workspace/lbt` is stale (`680a6cb`, 27,013-byte `index.html`) and should not be used as source of truth.

**6246200 backup**, Tuesday Nov 10, 2026, 7:51 PM ET (sidecar hashes; please `sha256sum -c`):

- `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_scenario.json` sha256 `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667`
- `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_modules.json` sha256 `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008`
- sidecar `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951.sha256`

Also useful, not a backup: frozen `/workspace/lawns-offer-page` (do not edit) and `/workspace/lawns-flow/flow-server.mjs`; playbook `/workspace/playbooks/lawns-booking-payment-playbook.md` section 2 ("Payload") and go-live items 2–11.

When you inspect `index.html` or the playbook, do not repeat the Make webhook URL in your notes.

## Claims to verify

1. The live form fields and `lead_data` keys match the table in the plan: required name, phone, email, address, city, ZIP, gate (values 48 / 30), pets confirmation, frequency (`Bi-Weekly` / `Monthly`), lot size (including "Not sure"); optional SMS consent and add-ons; required card-on-file agreement. No last-cut field. No "what service do you need?" field. The form POSTs to the 6246200 webhook (confirm the hook belongs to 6246200, but do not publish the URL).
2. In the Nov 10 backup, module 5–6 build `key` from first word of `lot_size` plus normalized `frequency`, and `base` is 0 when the key is unknown (including "Not sure"). Priced email (module 3) and priced SMS (module 9) require zone ≠ 3 and `base` > 0. Confirm email (7) and confirm SMS (10) run when zone = 3 or `base` = 0. Module 2 writes a Customers row if email contains `@` OR phone digits ≥ 10; Access_Notes is `Gate: {gate_width_inches} in`; Services / add_ons / pets / last cut are not written to the row. Owner email (module 4) would say "Price quoted: $0" if `base` is 0.
3. Gate, pets, and last cut are not used in the price formula or router filters. Dropping frequency and/or lot size forces `base` = 0 and the confirm path, and leaves Price_Per_Visit blank (not a customer-facing $0 quote). Instant-quote homepage copy would then be false unless changed.
4. The offer-page "Payload" and flow-server ACCEPT path are still TEST-only (no live pay link; 6918616 OFF; go-live items 2–11 open). flow-server auto pay-link requires Lot_Size starting with `small`, Frequency `biweekly`, zone 1 or 2, and Price_Per_Visit matching Stripe. Confirm or correct the plan's "still at payload" answer.
5. Option A and option B are described accurately, including the 6246200 changes listed for each. Option B keeps auto-price; option A does not, unless a later design assumes a frequency. The recommendation of B (plus a Mowing-default service field, no invented tree/irrigation list) is consistent with those facts and is left as Sisto's decision, not as something already applied.
6. The change list does not patch Make or the repo as part of this request, forbids merge/deploy, and keeps after-ACCEPT questions with go-live item 6.

## Out of scope

- Applying any website or Make patch, opening or merging a PR, deploying, turning TEST 6918616 on, or sending texts
- Changing 6246200 prices or zone lists
- Treating a Proof PASS as Sisto's go-live yes
- Editing the frozen offer-page build

## Ask

Proof: please PASS or FAIL the field list, the 6246200 dependency claims, and the A/B plan against the live site, GitHub `main`, and the Nov 10 backup. Write the verdict so Lawns can take only a Proof-passed option list to Sisto, or can correct the plan first.
