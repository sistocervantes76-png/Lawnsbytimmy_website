# Proof recheck — Lawns website address + preferred-day plan
Date: Tuesday, Nov 10, 2026, 8:26 PM ET (America/New_York)
Verdict: **PASS**. No required fixes. One correction, below, that does not change the recommended mapping or the A/B choice. Nothing was changed by this check (no Make write, no sheet write, no repo write, no message sent).

Plan file: `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md`
Plan sha256: `de5d2ad2e4a49a191515c2856c8570ac7ad5c23dac87d5d009f73657a2ee1916` — matches Lawns' claim and the file on disk.

Earlier check (service-field version): `/workspace/proof-notes/lawns-website-two-question-check-2026-11-10.md`. That PASS required option B to map the new field into the CRM row and the owner email. This revision does that for preferred day (Service_Day, column 20, and module 4), under both A and B. The old "What service do you need?" / Services column 12 requirement is correctly marked superseded. There is no service-type field in this draft.

---

## Findings

### (1) Plan hash — CONFIRMED
`sha256sum` of `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md` is exactly `de5d2ad2e4a49a191515c2856c8570ac7ad5c23dac87d5d009f73657a2ee1916`.

The Nov 10, 2026, 7:51 PM ET 6246200 backup sidecar also passes `sha256sum -c` from `/workspace/backups/make/`:
- scenario sha256 `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667`
- modules sha256 `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008`

Those match the hashes printed in the plan.

### (2) Service_Day is column 20; not written by the three live scenarios — CONFIRMED, with a correction on "unused"

Read the live Customers header (Google Sheets, header row only, plus the Service_Day column and Customer_ID / Status / Lead_Source for context). 0-based indexes, which is how 6246200 module 2 maps with `useColumnHeaders` off:

| index | header |
|---|---|
| 12 | Services |
| 15 | Access_Notes |
| 19 | Card_On_File |
| **20** | **Service_Day** |
| 21 | Next_Service_Date |
| 22 | Lead_Source |
| 23 | Notes |

Service_Day is `mapper.values.20`. That is the right existing column for a Tue/Wed/Thu/Fri/Sat answer. Using Services (12) or Notes (23) would be the wrong place.

Live Make, read-only `scenario_get` + `scenario_module_get`:

- **6246200** LBT_Quote, active, lastEdit Sunday Nov 8, 2026, 6:04:55 PM ET (`2026-11-08T23:04:55.154Z`), unchanged from the plan and from the Nov 10 backup. Module 2 (Customers addRow) writes values 0–11, 13–16, and 22. It does **not** write 12, 17–21, or 23. No `values.20`.
- **6671272** LBT Missed Call Text-Back, active, lastEdit Tuesday Nov 10, 2026, 8:20:34 PM ET (`2026-11-11T01:20:34.505Z`). Module 8 (Customers addRow) writes values 0, 1, 2, 5, 16, 22, 23 only. No `values.20`.
- **6618999** LBT_Customer_Account, active, lastEdit Tuesday Nov 3, 2026, 2:13:47 AM ET (`2026-11-03T07:13:47.329Z`). Module 3 only **reads** the Customers tab (and other tabs). Module 8 writes a new row on the **Account Requests** tab, not Customers. Neither writes Service_Day.

**Correction (not a required fix):** the column is not empty. The five Active Recurring customers already have values there: Wed, Thu, Wed, Thu, Thu. All later rows (test owner, website leads, missed-call leads) are blank. Those five values already use the same abbreviated weekday form the plan proposes. A new form-led addRow would not overwrite them. "Unused" is true for the three live scenarios, and overstated as a description of the column itself. Mapping new preferred-day answers into Service_Day is still the right call.

### (3) Mapping into module 2 and module 4 is concrete and would not break pricing or filters — CONFIRMED

Live 6246200 matches the Nov 10 backup on the pricing path and the current row/email mappings (compared module-for-module; lastEdit still Nov 8).

- Module 5 `key` is still the first word of `lead_data.lot_size` (trim, lower) plus `lead_data.frequency` (trim, lower, hyphens and spaces stripped). Example: `Small (under 5000 sqft)` + `Bi-Weekly` → `smallbiweekly`.
- Module 6 `base` is still the same switch, defaulting to **0** for any other key, including a missing size or frequency or "Not sure" (`not` + frequency). Zone is still ZIP-only (zone 2 trip $10). Gate, pets, last cut, add-ons, and a new preferred-day field are not inputs to `key`, `base`, `zone`, or `trip`.
- Filters, live: modules 3 and 9 require zone ≠ 3 and base > 0 (plus email `@` / SMS consent + phone). Modules 7 and 10 run when zone = 3 or base = 0 (plus the same contact checks). Module 2's "Real lead" filter is still email contains `@` OR digits-only phone length ≥ 10; day, gate, pets, size, and frequency are not in it.

**Option B** keeps lot size and frequency on the form with the current posted values, and adds a preferred-day field mapped to Service_Day (`values.20`) and to the module 4 owner email. It says not to change modules 5, 6, 3, 7, 9, 10, or the router filters. That would not break the price key or the filters. Required cleanups listed (do not apply now) are: re-backup first; stop writing `Gate:  in` when gate is absent (leave Access_Notes blank); map the new field into `values.20` and the owner email; reword or drop gate/pets lines on the owner email; post the day in `lead_data` (`service_day` or `preferred_day`) and omit `gate_width_inches` / `pets_secured` (do not send `pets_secured: false`). The two key-name options must be the same in the form and in Make when this is later applied; that is an implementation detail, not a hole in the plan.

**Option A** drops lot size and frequency, so `base` becomes 0 and in-zone leads fall onto the existing confirm path (modules 7 and 10), not a dollar quote. The plan correctly requires changing the owner email so it does not say "Price quoted: $0" (live module 4 is still `Price quoted: ${{sum(6.base; 6.trip)}}`, and it already warns that $0 means the customer got the confirm message). It also requires changing customer confirm wording and the Instant Quote / "about a minute" site copy, and the same Service_Day + owner-email mapping. It correctly says not to silently default a frequency just to keep auto-price.

### (4) Form day options match Tue–Sat exactly — CONFIRMED (in the plan; not on the live form)

The live homepage still has **no** preferred-day field (no `service_day`, no `preferred_day`, no "Tue"). That is expected: this plan is draft-only and was not applied.

Under both A and B the plan specifies a required choice with exactly these values: **Tue, Wed, Thu, Fri, Sat**. It says not to offer Mon or Sun unless he later expands the window. That matches the live missed-call first text ("which day works best (Tue-Sat)"). The five existing Service_Day cells already use that same abbreviation style (Wed, Thu).

There is no service-type field in either option. The live form also has none; it assumes mowing. Add-ons stay optional extras under B (and optionally under A).

### (5) Moving gate and pets off the form — CONFIRMED, with a collection-gap caveat the plan already states

Live module 2 Access_Notes (`values.15`) is exactly `Gate: {{1.lead_data.gate_width_inches}} in`. If gate is omitted and that mapping is left as-is, the cell would be the broken string `Gate:  in`. Pets are not written to the Customers row today; they appear only on the module 4 owner email (`Pets secured: {{1.lead_data.pets_secured}}`). The plan handles both: leave Access_Notes blank when gate is absent; remove or reword the gate and pets lines on the owner email; do not post `pets_secured: false`.

Price, zone, filters, and flow-server pay-link eligibility do not use gate or pets. I re-checked `/workspace/lawns-flow/flow-server.mjs`: `TEST_MODE = true`. Auto pay-link still depends on Lot_Size starting with `small`, Frequency normalizing to `biweekly`, and CRM Price_Per_Visit matching the Stripe test visit price (zone 1 / zone 2 prices are in that file). Option B keeps the size + frequency pair that path needs. Option A would leave website leads ineligible for an automatic pay link until those CRM fields are filled by hand.

**My Account:** `https://lawnsbytimmy.com/account` redirects (307) to `/account/`, which returns 200. The "Need something?" form includes **Update gate / pet / access notes** (and Skip a visit, Request an extra service, Something else). Sign-in is a texted 6-digit code. That path is for existing customers, through 6618999 onto the Account Requests tab, not a write into Service_Day or Access_Notes by itself.

**Caveat, already in the plan's live-vs-later table and change list item 5:** after-ACCEPT questions are not built, and ACCEPT is not live. If the form drops gate and pets now, new website leads will not have those answers collected automatically until go-live item 6 is done (or until Timmy asks himself, or until someone who is already a customer uses My Account). This is not a plan defect, but it has to be in the question to Sisto so "move gate and pets after accept" is not read as a path that already exists.

### (6) Plan vs live homepage and GitHub `main` — CONFIRMED, no material mismatch

Fetched Tuesday, Nov 10, 2026, 8:25 PM ET:

- Live `https://lawnsbytimmy.com/` HTTP 200, 28,181 bytes, sha256 `8183b85bb4117190d90dfbd3ad5ae37a4d26177e98868d9d101d7c241ee2ff8b`.
- GitHub `sistocervantes76-png/Lawnsbytimmy_website` `main` is still `d6482556807a165aa38793dbfe93085c272e65cf`, Thursday Nov 5, 2026, 7:49 AM ET (`2026-11-05T12:49:00Z`), message "Add a Substack signup section above the homepage footer. (#13)".
- `index.html` blob sha `fceb4ff483c79f248bf2863cf67bf6aedc4068c4`, 28,181 bytes. Live homepage is byte-identical to GitHub `main` `index.html`.

Form fields and posted `lead_data` keys match the plan: required first and last name, phone, email, address, city (Oakland Park, Fort Lauderdale, Wilton Manors), ZIP, gate (values 48 / 30), pets checkbox, frequency (`Bi-Weekly` / `Monthly`), lot size (values `Small (under 5000 sqft)`, `Medium (5000-10000)`, `Large (10000-20000)`, `XL (20000+)`, `Not sure`), card-on-file; optional SMS consent and the three add-ons. No last-cut field. No service-type field. No preferred-day field. Success copy is "Thank you! Check your email. Your price is on its way, usually within a minute." Button: Get My Instant Quote.

Instant-quote copy is on the page as the plan describes: "Pick your yard size and get your per-visit price by email in about a minute"; "Tell us about your property and we'll email you your price in about a minute"; How It Works step 1 "Get Your Instant Price" / "Submit your address and property details in 60 seconds"; step 2 already says "Review your quote, verify gate clearance, and link your card on file." (The plan joins the Instant Quoting heading and its description with an em dash; on the page they are separate elements. Same words.) Listed services are mowing, edging, line trimming, and blow-off. "Tree" appears only as trimming around trees and a Substack link, not as a tree-work service. No irrigation service. Option A correctly says this Instant Quote copy would become false if size and frequency are dropped.

The form still posts to the Make hook that triggers 6246200 (hook label LBT_Quote_Hook). The URL is not repeated here.

### (7) A/B question is fair; auto-price tradeoff is stated accurately — CONFIRMED

Option B (recommended): keep lot size and frequency so auto-price still works in zones 1–2 for known keys; add the required Tue–Sat day; drop gate and pets (and leave last cut off, as today); keep Instant Quote copy; map the day into Service_Day and the owner email.

Option A: same day field and the same mapping, but drop lot size and frequency, so there is no automatic dollar quote; confirm-path wording and Instant Quote copy have to change; owner email must not say $0; later ACCEPT pay-link would not auto-send until those CRM fields are filled by hand.

The plan states that A is the stricter reading of "only address and preferred day up front," and that dropping instant website pricing is Sisto's call, not a default. That is fair. Lawns' shorthand "Option A is the same as B but without auto-price" matches the plan if it is understood that size and frequency come off the form too.

---

## Required fixes

None. The earlier required fix (map the new field into the CRM row and the owner email) is in this revision for both options, pointed at Service_Day (column 20) rather than Services (column 12).

Correction only: do not call Service_Day an unused column in later notes without saying the five Active Recurring customers already have Wed/Thu there. No change to the mapping.

## One-line A/B question for Sisto

Do you want the website form to keep yard size and how often so people still get an instant price, add a required Tue–Sat day, and take gate and pets off the form (you'd ask those yourself until the after-accept questions are built) — that's B, recommended — or only ask contact, address, and day, with no instant price, so you quote those leads by hand — that's A?

## Scope of this check

Read-only: the plan file and hash, the Nov 10 6246200 backup, live 6246200 / 6671272 / 6618999 (get only), the Customers header and Service_Day column, the live homepage and `/account/`, and GitHub `main` `index.html`. Did not edit Make, the website, the sheet, or the repo, and did not message anyone. Did not publish webhook URLs, connection IDs, spreadsheet IDs, or keys. This is not approval to apply A or B, open a PR, or change 6246200.
