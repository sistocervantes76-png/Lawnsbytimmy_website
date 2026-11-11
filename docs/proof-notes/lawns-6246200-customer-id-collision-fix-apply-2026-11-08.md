# Apply + readback — 6246200 Customer_ID seconds

Sun Nov 8, 2026, 6:04:55 PM ET. Live Make write after Proof PASS of the planned one-field change (`/workspace/proof-notes/lawns-6246200-customer-id-collision-fix-check-2026-11-08.md`). No scenario run, no texts, no email, no 6691639 change, no offer-page deploy, no Stripe change.

## What changed
Live LBT_Quote (6246200) remains **active**. `lastEdit` after the write: `2026-11-08T23:04:55.154Z` (Sun Nov 8, 2026, 6:04:55 PM ET).

Module 2 Customer_ID generator:
- Before: `LC-{{formatDate(now; "YYMMDD-HHmm"; "America/New_York")}}`
- After (live readback): `LC-{{formatDate(now; "YYMMDD-HHmmss"; "America/New_York")}}`

## Readback diff vs pre-change backup
Backup: `/workspace/backups/make/6246200_before_customer_id_fix_20261108_modules.json`  
sha256 `c3d325f1f15c182529a210a5b404be7cfc9335cf7388efd95e073b9d96e00df9`

A full config comparison of live module 2 (fresh `scenario_module_get` after the write) against that backup showed **one** difference: `config.mapper.values.0` (`HHmm` -> `HHmmss`). Parameters and restore labels were unchanged. All other mapper fields and all other mapped column values were unchanged.

Post-change snapshot of the readback: `/workspace/backups/make/6246200_after_customer_id_fix_20261108_module2.json`

## Out of scope, checked
Module 6 mapper matches the pre-change backup: small bi-weekly base $45; zone 2 is the seven Fort Lauderdale ZIPs with a $10 trip fee ($55). Wiring, filters, and scenario status were not part of the edit.

Existing customer rows were not rewritten. New IDs will look like `LC-261108-180455`. Two generations in the same second can still collide.

Playbook pending-state note updated only after this verified readback.
