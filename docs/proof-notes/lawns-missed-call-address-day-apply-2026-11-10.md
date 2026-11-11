# Apply + readback — Lawns missed-call first text, address + preferred day Tue-Sat (6671272)

Tuesday Nov 10, 2026, 8:20:34 PM ET (America/New_York). Live Make write after Sisto refined the two questions in Proof's chat the same evening. Lawns did not independently read those typed turns; Proof reported them and supplied the exact lines:

- 8:16 PM ET: "address and when thjey would like it done"
- 8:17 PM ET: "Yes, put the address + when text live"
- 8:18 PM ET: preferred day, Mon-Fri
- 8:19 PM ET: "tuesday thru saturday is better"

The earlier 8:04 PM ET "Make it live, put it in" in Lawns chat remains the go-ahead for this missed-call first-text change. Neither the 148-character "when you'd like it done" draft nor the Mon-Fri preferred-day draft was written live. Only the final Tue-Sat wording below was patched.

The scenario was not run. No SMS or email was sent. 6691639, 6246200, TEST clones, Stripe, the website, and RingCentral were not changed. After-ACCEPT wording was not applied (it still needs its own go-live).

## Pre-check

Fresh backup, taken immediately before the write (sidecar `sha256sum -c` OK):

- `/workspace/backups/make/6671272_before_address_day_sms_20261110_2019_modules.json` sha256 `e4b4b29c59ca2cf3ef6ead2172d2db0bfaab3d35fc7d28b1e3e11293a7dd6cdc`
- `/workspace/backups/make/6671272_before_address_day_sms_20261110_2019_scenario.json` sha256 `c2623018b65eb43286045f8dbf0665593b960df58a5440da06109ad58d770b0f`
- sidecar `/workspace/backups/make/6671272_before_address_day_sms_20261110_2019.sha256`

The modules hash matches `/workspace/backups/make/6671272_after_two_question_sms_20261110_modules.json` (same content). Fresh `scenario_get` plus a full module read showed `lastEdit` still `2026-11-11T01:07:25.720Z` (Tue Nov 10, 2026, 8:07:25 PM ET). Status was already **active**. Modules 4, 8, and 9 were equal to that 8:07 PM ET after-snapshot, including the three fields below.

## What changed (live 6671272 only)

One `scenario_patch`, `expectedLastEdit` the 8:07:25 PM ET value, three `module_config_set` operations. Each mapper domain was sent complete so other mapped fields were not wiped. No other modules, filters, data-store fields, scheduling, or activation were touched.

Live LBT Missed Call Text-Back (6671272) remains **active**. New `lastEdit`: `2026-11-11T01:20:34.505Z` (Tue Nov 10, 2026, 8:20:34 PM ET).

### Module 4 `mapper.text` (first auto-text)

Before (146 characters, GSM-7, 1 segment):

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) what service you need. Reply STOP to opt out.

After (155 characters, GSM-7, 1 segment; apostrophe in `Timmy's` is U+0027; hyphen in `Tue-Sat` is U+002D):

> Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) which day works best (Tue-Sat). Reply STOP to opt out.

Other module 4 mapper fields (`to`, `phoneFrom`) were unchanged.

### Module 8 `mapper.values.23` (Customers Notes)

Before:

> Missed call {{5.call_time}}. Auto-text sent asking for address and what service they need.

After:

> Missed call {{5.call_time}}. Auto-text sent asking for address and preferred day (Tue-Sat).

All other `values.*` keys, the sheet, and the tab were unchanged.

### Module 9 `mapper.content` (owner notice)

Only the listing inside the existing sentence was replaced. Everything else in the email (subject, greeting, caller/time lines, CRM sentence) was unchanged.

Before (listing only): `(address and what service they need)`

After (listing only): `(address and preferred day, Tue-Sat)`

Full sentence after the write: "They were texted the quick-quote questions (address and preferred day, Tue-Sat)."

## Readback diff vs pre-change backup

After-snapshot: `/workspace/backups/make/6671272_after_address_day_sms_20261110_modules.json`  
sha256 `f4335285c15d16864232d7e62f45c9ce2d0743201809b708ce36cc12cde588a5`  
sidecar `/workspace/backups/make/6671272_after_address_day_sms_20261110_modules.json.sha256` (`sha256sum -c` OK)

A full config comparison of every module from a fresh `scenario_module_get` after the write, against the 8:19 PM ET modules backup, showed **exactly three** differences: module 4 `mapper.text`, module 8 `mapper.values.23`, and module 9 `mapper.content`, as quoted above. Parameters and restore labels were unchanged. Filters, wiring, trigger, and scheduling were unchanged. The scenario envelope differed only in `lastEdit`. The scenario stayed active.

## Left unchanged, as planned

The service question is no longer in the live first text. Gate, pets, bi-weekly or monthly, and last cut are still not asked automatically anywhere live until ACCEPT go-live. After-ACCEPT SMS was not added. 6691639, 6246200, TEST clones, Stripe, RingCentral, and the website were not touched. The website plan was revised after this readback so follow-suit means address + preferred day (Tue-Sat).

Teaching facts `/workspace/playbooks/lawns-missed-call-teaching-facts-2026-11-08.md` were updated to the new live text. The missed-call plan file has an Applied v2 section.
