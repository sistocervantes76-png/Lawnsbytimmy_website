# Proof check request: Lawns missed-call two-question SMS drafts and change list
> **Status note (docs bundle, after 8:20:34 PM ET Nov 10):** This request was for the earlier “address + what service you need” draft. That first text is **no longer live.** The current live 6671272 text asks for address and which day works best (Tue–Sat). See `lawns-missed-call-address-day-apply-2026-11-10.md` and `../CHANGELOG.md`.

Date: Tuesday, Nov 10, 2026, evening America/New_York
Status: **DRAFTS AND A PLAN ONLY. NOT APPLIED. NOT SENT.** No Make write. No SMS or email sent.

## Authorization / source (Alexander-relayed)

Alexander reports that Sisto typed the following in Alexander's chat on Tuesday, Nov 10, 2026, at 7:46 PM ET. **Lawns has not independently read that typed turn yet.**

> The mix scenario for the Lawns by Timmy CRM is for the missed-call text back. The questions we text them should be just two to get the ball rolling, and the rest should be asked when they accept the offer. We already have their phone number so we just need their address and what service they're looking for. That should be enough.

This request is not permission to patch live Make, to send texts, or to turn on ACCEPT. The Nov 8 item-8 wording OK and "the answer for Lawns is yes" covered the Nov 7 quote / pay-link / receipt packet, not this new missed-call wording.

## What to check

Plan: `/workspace/playbooks/lawns-missed-call-two-question-plan-2026-11-10.md`

Please PASS or FAIL the plan's **quoted live wording**, **draft SMS texts and segment counts**, and **change list** against the live backups below (and the stated TEST inspect facts). Do not treat a PASS as approval to apply anything.

## Backups to use (read-only, Tuesday Nov 10, 2026, 7:51 PM ET)

Wrappers were stripped to the first JSON object. Sidecars list both hashes.

**6671272** LBT Missed Call Text-Back — status **active**, lastEdit 2026-10-25T16:12:19.308Z = **Sun Oct 25, 2026, 12:12:19 PM ET**

- `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951_scenario.json` sha256 `1334a085ac412e61de372709aee8996aef4086d181237dd7e30657df631066d1`
- `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951_modules.json` sha256 `084b39e8b686b1bab44755e2473f4fd846ed120104d0343cf874b11c6854e663`
- sidecar `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951.sha256`

**6691639** LBT Text Replies + STOP — status **active**, lastEdit 2026-11-05T19:25:34.840Z = **Thu Nov 5, 2026, 2:25:34 PM ET**

- `/workspace/backups/make/6691639_before_two_question_sms_20261110_1951_scenario.json` sha256 `4b1103c4f08e9f5812ea1e9501ca9f118ed5574fe00fd403cc4bb0c4fdfe0d88`
- `/workspace/backups/make/6691639_before_two_question_sms_20261110_1951_modules.json` sha256 `a16c80cd54bb9dc7e7d042555c59fa7c7e479ed1023af2e35801aeb52f56b6be`
- sidecar `/workspace/backups/make/6691639_before_two_question_sms_20261110_1951.sha256`

**6246200** LBT_Quote — status **active**, lastEdit 2026-11-08T23:04:55.154Z = **Sun Nov 8, 2026, 6:04:55 PM ET**

- `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_scenario.json` sha256 `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667`
- `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_modules.json` sha256 `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008`
- sidecar `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951.sha256`

TEST 6918616 was inspected read-only the same evening (status **inactive / OFF**, lastEdit 2026-11-05T19:29:36.875Z = **Thu Nov 5, 2026, 2:29:36 PM ET**). It is not in the formal backup set. Please confirm or correct the plan's claims that this TEST clone has an ACCEPT route, has no outbound SMS module, and posts ACCEPT handling to the box-only flow service.

Also useful, not a backup: `/workspace/playbooks/lawns-booking-payment-playbook.md` (go-live items 2–11 still open) and `/workspace/playbooks/lawns-missed-call-teaching-facts-2026-11-08.md` (describes the current 5-question text).

## Claims to verify

1. Live 6671272 module 4 `mapper.text` is exactly the 5-question SMS quoted in the plan (244 characters, GSM-7, 2 segments; apostrophe U+0027; inch mark in `36"` is U+0022). The same questions are also named in module 8 `mapper.values.23` (Customers Notes) and module 9 `mapper.content` (owner notice). The data store does not store the question list.
2. Draft first auto-texts and the after-ACCEPT text match the plan's exact strings, character counts, GSM-7, and 1-segment claims, and use only plain ASCII.
3. Live 6691639 has no ACCEPT route and no outbound SMS. YES maps to opt back in. ACCEPT falls through to kind `reply` (owner email only).
4. 6246200 module 6 prices from lot size + frequency (`base` = 0 when the key does not match). Gate / pets / last cut are not inputs to that formula. Flagging frequency-before-price as a conflict for Sisto is fair; the plan must not decide it.
5. The change list does not patch live Make as part of this request, requires a re-backup and Proof PASS plus Sisto's yes before any later apply, treats after-ACCEPT questions as TEST-first and live-only with go-live item 6, and states that changing 6671272 now would leave the four questions unasked anywhere live until ACCEPT is on.
6. Teaching facts would need an update only if/when the live 6671272 text actually changes.

## Out of scope

- Applying any patch, turning TEST 6918616 on, or sending texts
- Changing 6246200 prices or quote copy
- Treating a Proof PASS as Sisto's go-live yes

## Ask

Proof: please PASS or FAIL the draft wording and the change list against the backups and the claims above. Write the verdict so Lawns can send Sisto only Proof-passed exact SMS wording, or can correct the plan first.
