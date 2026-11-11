# Apply + readback — Lawns two-question missed-call first text (6671272)

> **Status note (docs bundle, after 8:20:34 PM ET Nov 10):** The “address + what service you need” first text recorded below was live only from 8:07:25 PM ET until 8:20:34 PM ET. It is **no longer the current live text.** It was replaced by the address + preferred day (Tue–Sat) wording. See `lawns-missed-call-address-day-apply-2026-11-10.md` and `../CHANGELOG.md`. This file is kept as the historical record of the 8:07 PM ET apply.

Tuesday Nov 10, 2026, 8:07:25 PM ET (America/New_York). Live Make write after Proof FIX-then-clear wording (`/workspace/proof-notes/lawns-missed-call-two-question-check-2026-11-10.md`) and Sisto's typed OK in Lawns chat at 8:04 PM ET: "Make it live, put it in, and does the wording need to be changed in RingCentral."

The scenario was not run. No SMS or email was sent. 6691639, 6246200, TEST clones, Stripe, the website, and RingCentral were not changed. After-ACCEPT wording was not applied (it still needs its own go-live).

## Pre-check

Backup sidecars for `/workspace/backups/make/6671272_before_two_question_sms_20261110_1951_{scenario,modules}.json` verified (`sha256sum -c` OK):
- modules `084b39e8b686b1bab44755e2473f4fd846ed120104d0343cf874b11c6854e663`
- scenario `1334a085ac412e61de372709aee8996aef4086d181237dd7e30657df631066d1`

Fresh `scenario_get` plus a full module read, taken immediately before the write, matched that backup. `lastEdit` was still `2026-10-25T16:12:19.308Z` (Sun Oct 25, 2026, 12:12:19 PM ET). Status was already **active**. Modules 4, 8, and 9 were equal to the 7:51 PM backup, including the three fields below.

## What changed (live 6671272 only)

One `scenario_patch`, `expectedLastEdit` the Oct 25 value, three `module_config_set` operations. Each mapper domain was sent complete so other mapped fields were not wiped. No other modules, filters, data-store fields, scheduling, or activation were touched.

Live LBT Missed Call Text-Back (6671272) remains **active**. New `lastEdit`: `2026-11-11T01:07:25.720Z` (Tue Nov 10, 2026, 8:07:25 PM ET).

### Module 4 `mapper.text` (first auto-text)

Before (244 characters, 2 GSM-7 segments):

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. For a fast quote, reply with: 1) Address 2) Is your back gate at least 36" wide? 3) Any pets? 4) Bi-weekly or monthly service? 5) When was it last cut? Reply STOP to opt out.

After (146 characters, GSM-7, 1 segment; apostrophe in `Timmy's` is U+0027):

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) what service you need. Reply STOP to opt out.

Other module 4 mapper fields (`to`, `phoneFrom`) were unchanged.

### Module 8 `mapper.values.23` (Customers Notes)

Before:

> Missed call {{5.call_time}}. Auto-text sent asking for address, gate, pets, bi-weekly/monthly, last cut.

After:

> Missed call {{5.call_time}}. Auto-text sent asking for address and what service they need.

All other `values.*` keys, the sheet, and the tab were unchanged.

### Module 9 `mapper.content` (owner notice)

Only the five-question listing inside the existing sentence was replaced. Everything else in the email (subject, greeting, caller/time lines, CRM sentence) was unchanged.

Before (listing only): `(address, gate width, pets, bi-weekly or monthly, last cut)`

After (listing only): `(address and what service they need)`

Full sentence after the write: "They were texted the quick-quote questions (address and what service they need)."

## Readback diff vs pre-change backup

After-snapshot: `/workspace/backups/make/6671272_after_two_question_sms_20261110_modules.json`  
sha256 `e4b4b29c59ca2cf3ef6ead2172d2db0bfaab3d35fc7d28b1e3e11293a7dd6cdc`  
sidecar `/workspace/backups/make/6671272_after_two_question_sms_20261110_modules.json.sha256` (`sha256sum -c` OK)

A full config comparison of every module from a fresh `scenario_module_get` after the write, against the 7:51 PM modules backup, showed **exactly three** differences: module 4 `mapper.text`, module 8 `mapper.values.23`, and module 9 `mapper.content`, as quoted above. Parameters and restore labels were unchanged. Filters, wiring, trigger, and scheduling were unchanged. The scenario stayed active.

## RingCentral

Module 4 is `ringcentral:sendSMSMMS`. This flow sends the missed-call SMS from Make, using the inline `mapper.text` quoted above. The trigger is `ringcentral:missedCall` (immediate webhook). A scan of the scenario modules found no RingCentral-side template id, auto-reply, or answering-rule reference. RingCentral itself was not opened, inspected, or changed. For this missed-call text-back, the wording lives in Make module 4, so no RingCentral-side wording change was required.

## Left unchanged, as planned

The four moved questions (gate, pets, bi-weekly or monthly, last cut) are not asked automatically anywhere live until ACCEPT go-live. After-ACCEPT SMS was not added. 6691639, 6246200, TEST clones, Stripe, and the website were not touched.

Teaching facts `/workspace/playbooks/lawns-missed-call-teaching-facts-2026-11-08.md` were updated to the new live text and now state that those four questions are not asked anywhere live until ACCEPT go-live. The plan file has an Applied section.
