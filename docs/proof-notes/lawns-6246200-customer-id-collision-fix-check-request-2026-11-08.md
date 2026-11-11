# Proof check request: 6246200 (LBT_Quote) Customer_ID collision fix (Sun Nov 8, 2026)

**Status: PLANNED, NOT APPLIED.** No Make write has been made.

## Authorization (Alexander-reported)
Alexander reports that Sisto answered "7-8 yes" in Alexander's chat on Sun Nov 8, 2026 at about 5:55 PM ET. That answer refers to items 7 and 8 on Alexander's unanswered-questions list. Lawns has not seen that typed turn itself.
Item 7 says yes to this live 6246200 Customer_ID collision fix, after a backup. (Item 8, the wording OK, is recorded in the playbook. It is not part of this change.)

## What is live now (read-only, Nov 8 ~6 PM ET)
- Scenario 6246200 "LBT_Quote", status **active**. lastEdit 2026-11-05T17:55:09Z = **Thu Nov 5, 2026 12:55:09 PM ET**.
- Module 2 (google-sheets:addRow, sheet "Customers" in the "Lawns By Timmy CRM" spreadsheet), mapper `values.0`:
  `LC-{{formatDate(now; "YYMMDD-HHmm"; "America/New_York")}}`
- This matches the Nov 5 backup. It is the only `LC-` / `HHmm` Customer_ID expression across all 19 modules (1,5,6,2,11,4,8,3,22,23,7,24,25,9,26,27,10,28,29).
- Backups (full raw configs; they contain hook/connection IDs, so do not paste them into notes):
  - `/workspace/backups/make/6246200_before_customer_id_fix_20261108_scenario.json`, sha256 `15a85591ecb05116de2fca6b753050acdf1025341a0cd8b3b83289e2302d0743`
  - `/workspace/backups/make/6246200_before_customer_id_fix_20261108_modules.json`, sha256 `c3d325f1f15c182529a210a5b404be7cfc9335cf7388efd95e073b9d96e00df9`
  - Sidecar: `/workspace/backups/make/6246200_before_customer_id_fix_20261108.sha256`

## Proposed change (one field only)
Module 2 `mapper.values.0`:
- OLD: `LC-{{formatDate(now; "YYMMDD-HHmm"; "America/New_York")}}`
- NEW: `LC-{{formatDate(now; "YYMMDD-HHmmss"; "America/New_York")}}`

No other value in module 2 changes, and no other module changes. Existing rows keep their old IDs. New IDs will look like `LC-261108-175532`.

## Why
Issue #28: two leads created in the same minute can share an `LC-YYMMDD-HHmm` ID. ACCEPT and Stripe matching will later depend on unique IDs. Adding seconds is the smallest fix that matches the approved problem ("same minute"). This change does not turn on ACCEPT.

## Out of scope / must stay unchanged
- Quote prices in module 6 (small bi-weekly $45 zone 1 / $55 zone 2 via a +$10 trip), the zone 2 ZIP list, and the $10 trip fee
- All SMS and email copy in 6246200, the webhook, the sheet target, filters, connections, and every other module
- No 6691639 ACCEPT routing, no texts sent, no offer-page deploy, no live Stripe prices

## Ask
Proof: please PASS or FAIL the planned change against the backup JSON and `/workspace/playbooks/lawns-booking-payment-playbook.md` before Lawns applies it.

## Sequencing
Lawns applies the change only after a Proof PASS. Lawns then reads module 2 back from live and confirms only `values.0` changed (diff against the backup), and reports the result to Alexander. Issue #28 stays OPEN until then.
