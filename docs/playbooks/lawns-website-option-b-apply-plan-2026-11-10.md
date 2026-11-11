# Lawns website Option B apply plan — keep instant price, add Tue–Sat day
Date: Tuesday, Nov 10, 2026, after 8:39 PM ET (America/New_York)
Status: **DRAFT ONLY. NOT APPLIED. NO PR. NOT DEPLOYED.** Pending Proof's check, then Sisto's OK on the live change, before any website PR or 6246200 patch. This document does not change the website, Make, or the repo.

**Do not publish:** webhook URLs (including `LEAD_WEBHOOK_URL` in `index.html`), connection IDs, keys, datastore IDs, spreadsheet IDs, or account emails other than info@lawnsbytimmy.com.

---

## 0. Sisto's choice (current vs superseded)

**Current direction, Tuesday Nov 10, 2026, 8:39 PM ET — recorded as relayed by Proof.** Sisto picked Option B on Proof's card in Proof's chat: **"B: keep yard size and frequency for the instant price, add the Tue-Sat day."** Lawns could not see the card pick itself in the transcript. Proof's 8:39 PM ET chat message to him states the switch from A to B. This plan treats that relayed 8:39 PM ET pick as the chosen direction.

**Superseded, 8:32–8:33 PM ET, Lawns chat (card answers, relayed by Lawns).** He first picked Option A (contact, address, and at that moment "service"; he prices web leads by hand), then "Option A with the Tue-Sat day choice, matching the text." Those answers are no longer current. The Option A apply plan `/workspace/playbooks/lawns-website-option-a-day-plan-2026-11-10.md` is shelved as history (SUPERSEDED banner) and must not be applied.

This 8:39 PM ET pick is not yet approval to change the live site or 6246200. Apply only after Proof PASSes this plan and Sisto says yes to the live change, in his own words.

Starting sources (read-only, this draft):

| Source | Result |
|---|---|
| Proof-passed A/B plan `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md` (sha256 `de5d2ad2e4a49a191515c2856c8570ac7ad5c23dac87d5d009f73657a2ee1916`, Proof PASS 8:26 PM ET) | **Left unchanged.** This apply plan follows its Option B section (keep lot size + frequency so auto-price still works; add required Tue–Sat day; move gate and pets off the form; map the day to Service_Day column 20 and the owner email). |
| Shelved Option A plan and the research behind it (live form, GitHub `main`, 6246200 Nov 10 backup) | Reused below. Option A is not the direction. |
| 6246200 backup, Tue Nov 10, 2026, 7:51 PM ET | modules sha256 `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008`; scenario sha256 `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667`. Name LBT_Quote, status active, lastEdit Sunday Nov 8, 2026, 6:04:55 PM ET (`2026-11-08T23:04:55.154Z`). Re-GET lastEdit immediately before any later patch. |
| Live site `https://lawnsbytimmy.com/` fetched Tue Nov 10, 2026, 8:33 PM ET | HTTP 200, 28,181 bytes, sha256 `8183b85bb4117190d90dfbd3ad5ae37a4d26177e98868d9d101d7c241ee2ff8b`. One quote form (`#leadForm` / `#quote-form`). |
| GitHub `sistocervantes76-png/Lawnsbytimmy_website`, branch `main` (read-only MCP) | HEAD `d6482556807a165aa38793dbfe93085c272e65cf` (Thu Nov 5, 2026, 7:49 AM ET). `index.html` blob sha `fceb4ff483c79f248bf2863cf67bf6aedc4068c4`, size 28,181 bytes — same size, fields, and payload keys as the live homepage. Public repo. The quote form lives only in `index.html`. The Worker (`src/worker.js`) only handles `/api/account/*`. |

The form posts JSON `{ event: "lead_form_submitted", timestamp, lead_data: { … } }` to the Make custom webhook that triggers **LBT_Quote (6246200)**. Do not publish or change that URL.

---

## 1. Exact form field changes

Keep contact info, address, **lot size, and frequency**, so the instant price stays. Add a required preferred-day field. Remove gate and pets.

Posted values for the day field must be the abbreviated weekdays already used in Service_Day: **Tue, Wed, Thu, Fri, Sat**. Do not offer Mon or Sun. Do not post "Tuesday" or "Tue-Sat".

### 1.1 Keep (same labels, required flags, and values as live)

| Label | HTML name | Required? | Values / notes |
|---|---|---|---|
| First Name | `first_name` | Yes | text |
| Last Name | `last_name` | Yes | text |
| Cell Phone | `phone` | Yes | tel |
| Email | `email` | Yes | email |
| SMS consent checkbox (current full 10DLC / STOP language, Privacy and Terms links) | `sms_consent` | No | checkbox; post boolean `true` only if checked. Do not change this language. |
| Service Address | `service_address` | Yes | text |
| City | `city` | Yes | Oakland Park, Fort Lauderdale, Wilton Manors |
| Zip Code | `zip` | Yes | 5 digits |
| Service Frequency | `frequency` | Yes | `Bi-Weekly` / `Monthly` (same radio labels as live) |
| Lawn size (grass area only) | `lot_size` | Yes | Same five options, including `Not sure` (Not sure already goes to the confirm path) |

Instant-quote copy, the "Get My Instant Quote" button, and the success message **"Thank you! Check your email. Your price is on its way, usually within a minute."** stay, because a priced email still goes out when size + frequency + ZIP price (Proof-passed plan, Option B, lines 218–222 and 243).

### 1.2 Add (required)

| Label (proposed) | HTML name | Required? | Values |
|---|---|---|---|
| Which day works best (Tue-Sat)? | `service_day` | **Yes** | Radio (or select). Posted values exactly: `Tue`, `Wed`, `Thu`, `Fri`, `Sat`. Visible labels may spell out Tuesday…Saturday as long as the posted value is the three-letter form. |

Payload: add `lead_data.service_day`. Use this same key in 6246200 (`{{1.lead_data.service_day}}`).

### 1.3 Remove from the form and from the payload

Do not leave hidden inputs. Do not post `pets_secured: false` or `gate_width_inches: null` (a false pets value would read as "pets not secured" if the owner email were left unchanged).

| Label (live today) | HTML name | Live required? |
|---|---|---|
| Gate Clearance Width (36" or wider → `48`; standard walk gate → `30`) | `gate_width` (payload `gate_width_inches`) | Yes |
| "I confirm pets will be secured indoors…" | `pets_secured` | Yes (must check) |

Last cut stays off the form, as it is today.

### 1.4 Card-on-file and add-ons

See §7. Until those questions are answered, the PR draft should **keep both on the form** as they are today, matching the Proof-passed Option B field list (two-question plan lines 217–220). If Sisto later says to move either one, drop it from the form and from the payload in the same PR.

---

## 2. Exact file and line edits on `main` at `d648255`

All required form edits are in **`index.html`** (blob `fceb4ff483c79f248bf2863cf67bf6aedc4068c4`, 28,181 bytes, 903 lines). Line numbers below are from that file, which matches the live homepage fetched 8:33 PM ET. Do not change `src/worker.js`, `account/index.html` (My Account "Update gate / pet / access notes" is for existing customers, out of scope), `terms.html`, `privacy.html`, or the repo `README.md`. Do not put the webhook URL in the PR body. Do not change `LEAD_WEBHOOK_URL`.

### 2.1 Required edits

**A. Delete the Gate Clearance Width fieldset and the pets checkbox** — `index.html` lines 665–687 (the two `form-row` blocks: fieldset legend "Gate Clearance Width" through the `pets_secured` checkbox row).

**B. Insert the required day field in that same place** (after the city/ZIP row that ends at line 663, before the Service Frequency fieldset that today starts at line 689). Proposed markup (posted values must be exactly these five strings):

```html
          <div class="form-row">
            <fieldset>
              <legend>Which day works best (Tue-Sat)?</legend>
              <div class="radio-group">
                <div class="choice-row">
                  <input type="radio" id="day_tue" name="service_day" value="Tue" required>
                  <label for="day_tue">Tue</label>
                </div>
                <div class="choice-row">
                  <input type="radio" id="day_wed" name="service_day" value="Wed" required>
                  <label for="day_wed">Wed</label>
                </div>
                <div class="choice-row">
                  <input type="radio" id="day_thu" name="service_day" value="Thu" required>
                  <label for="day_thu">Thu</label>
                </div>
                <div class="choice-row">
                  <input type="radio" id="day_fri" name="service_day" value="Fri" required>
                  <label for="day_fri">Fri</label>
                </div>
                <div class="choice-row">
                  <input type="radio" id="day_sat" name="service_day" value="Sat" required>
                  <label for="day_sat">Sat</label>
                </div>
              </div>
            </fieldset>
          </div>
```

**C. Payload in the submit script** — lines 858–872. Keep `lot_size` and `frequency`. Add `service_day: data.get('service_day') || ""`. **Delete** these two keys and do not replace them with null/false:

- line 868: `gate_width_inches: Number(data.get('gate_width')) || null,`
- line 869: `pets_secured: data.get('pets_secured') === 'on',`

Leave `add_ons` and `card_on_file_agreed` as they are unless §7 is answered the other way. If add-ons stay, keep `const addOns = data.getAll('add_ons');` (line 853).

### 2.2 Copy that mentions gate or pets (keep, not a required edit)

These are not form fields. The Proof-passed Option B section already says homepage instant-quote copy can stay, and that How It Works step 2 already places gate clearance after the quote (lines 243, 220–222).

| Lines | Live copy | Action |
|---|---|---|
| 596 | How It Works step 2: "Review your quote, verify gate clearance, and link your card on file." | **Keep.** This already describes gate (and card) as after the quote, which is what Option B does. |
| 762–763 | FAQ: "How do you handle gate codes and pets?" / "Access codes are stored securely in our field app. Pets must be secured indoors and gates unlocked on scheduled route days." | **Keep.** Policy for scheduled service, not a form question. |
| 771 | FAQ: "We collect a card on file during account setup…" | **Keep.** Billing policy; not gate/pets. Listed because it sits next to that FAQ. |

No other `index.html` copy must change for Option B. Instant-quote strings (lines 7, 522, 529–530, 590–591, 610–611, 743, 746, 897) stay. Optional, not required: tweak line 591 ("Submit your address and property details in 60 seconds.") to mention the preferred day. Do not do that unless Sisto wants it.

`account/index.html` mentions gate / pet / access notes on the existing-customer "Need something?" form. Leave it alone.

---

## 3. Exact 6246200 module changes

6246200 is the website-quote scenario only. Do not change prices, zone lists, connections, the webhook URL, modules 5–6, or the priced/confirm router filters (modules 3, 7, 9, 10).

`scenario_patch` `module_config_set` **replaces the whole mapper**. For every module you touch, send the **complete current mapper** (every key, including unchanged connection, spreadsheet, from/to, and other mapper fields), plus **`expectedLastEdit`** from a fresh `scenario_get` taken immediately before the patch. If lastEdit does not match, stop and re-read. Do not publish connection IDs, spreadsheet IDs, or hook URLs.

### 3.1 Backup first

Immediately before the patch, re-backup live 6246200 (full scenario + every module) to `/workspace/backups/make/`, write sha256 sidecars, and record `lastEdit`. Do not use the sanitized docs-bundle JSON as a restore source (IDs are placeholders). The Nov 10, 7:51 PM ET backup (modules sha `168a8ca0…`, lastEdit `2026-11-08T23:04:55.154Z`) is the known-good baseline only until a fresher pre-patch backup exists.

### 3.2 Module 2 — Customers `addRow` only (will not overwrite existing Service_Day)

This module **inserts a new row** (`insertDataOption: INSERT_ROWS`) when the "Real lead (has email or phone)" filter passes. That filter is unchanged: email contains `@`, OR digits-only phone length ≥ 10. Day, gate, and pets are not in it, so dropping gate/pets does not block the CRM row and cannot error the filter.

Current mapped indexes (0-based, `useColumnHeaders` false): 0–11, 13–16, and 22. Unmapped among 0–23: 12 (Services), 17–21 (including **Service_Day at 20**), 23 (Notes).

**Required mapper edits** (keep every other `values.*` entry as it is, including Lot_Size, Frequency, and the price formulas):

1. **Add `values.20`:** `{{1.lead_data.service_day}}` — the only write of preferred day into the sheet. Do not put the day in Services (12) or Notes (23).
2. **Change `values.15` (Access_Notes).** Live formula is `Gate: {{1.lead_data.gate_width_inches}} in`. If gate is omitted that becomes the broken string `Gate:  in`. **Exact new formula:**

```
{{if(empty(1.lead_data.gate_width_inches); emptystring; "Gate: " + 1.lead_data.gate_width_inches + " in")}}
```

When the old form is still live and posts 48 or 30, this still writes `Gate: 48 in` / `Gate: 30 in`. When the new form omits the key, the cell is blank. Confirm this Make syntax against a dry read of the mapper at apply time; the intent must be: blank if empty, otherwise `Gate: {inches} in`.

**Service_Day already has values on existing customers. New leads must not overwrite them.** Five Active Recurring rows already have Wed or Thu in Service_Day (same abbreviation style). Later rows are blank. 6246200 module 2, 6671272 module 8, and 6618999 do not write `values.20` today. Because module 2 is **addRow only**, mapping `values.20` writes the new lead's day onto a **new** Website Form row. It does not update existing rows and cannot overwrite those five Active Recurring cells. This work must also **not** introduce a search-and-update, `updateRow`, or bulk write to column 20, and must not start writing Service_Day from 6671272 or 6618999.

If add-ons stay on the form, mapping them into Services (`values.12`) remains an optional cleanup (they are collected today and then dropped). Do not do that in this patch unless Sisto asks (see §7).

### 3.3 Modules 5 and 6 — auto-price unchanged

Leave both mappers exactly as they are. Module 5 `key` stays the first word of `lot_size` (trim, lower) plus `frequency` (trim, lower, hyphens and spaces stripped). Module 6 `base` / `zone` / `trip` stay the same switch. Gate, pets, add-ons, and `service_day` are not inputs to `key`, `base`, `zone`, or `trip`. Known size + frequency pairs in zones 1–2 still auto-price (including summer monthly amounts and the $10 zone-2 trip). "Not sure" and zone 3 still use the confirm path (modules 7 and 10).

Do not add a default frequency or lot size. Do not force `base` = 0.

### 3.4 Missing gate or pets must not error any module or filter, including 3 and 9

Today, only module 2 (`values.15`) and module 4 (owner-email lines "Gate width: …" and "Pets secured: …") read those fields. Modules 3 and 9 (priced customer email and SMS) do **not** reference gate or pets in their filters or copy. Modules 5, 6, 7, 10, 11, and the failure emails 22/24/26/28 also do not. Do not add gate or pets to those modules.

- Filters for modules 3 and 9 stay: zone ≠ 3 AND `base` > 0, plus email / SMS-consent+phone. Missing gate or pets cannot fail those filters.
- After the form change, the payload simply omits the two keys. Module 2's new Access_Notes formula (§3.2) and module 4's conditional lines (§3.5) treat empty as blank text, not an error.
- Do not post `pets_secured: false`.

### 3.5 Module 4 — owner email must include preferred day; gate/pets only if present

Always sends today after the CRM row. Required content changes (complete mapper: to, content, subject, bodyType). Keep the "NO EMAIL ON FORM" warning, the contact block, lot size, frequency, zone, and the existing "Price quoted: ${{sum(6.base; 6.trip)}} per visit" line (auto-price still runs under B; the $0 wording is already qualified for zone 3 / unknown size, and this work does not take that path down).

Add: `Preferred day: {{1.lead_data.service_day}}`

Replace the always-on gate and pets lines with:

```
{{if(empty(1.lead_data.gate_width_inches); emptystring; "Gate width: " + 1.lead_data.gate_width_inches + " in<br>")}}
{{if(empty(1.lead_data.pets_secured); emptystring; "Pets secured: " + 1.lead_data.pets_secured + "<br>")}}
```

When those keys are missing, say once (not as a quoted value) that gate clearance and pets will be asked after they accept, once that step is live. When the old form is still live and those keys are present, the lines still print as they do today. Keep the card-on-file line if the checkbox stays on the form (§7). Subject can stay as it is.

### 3.6 Modules not changed

Module 1 (webhook), modules 5 and 6, module 8 (router), modules 3, 7, 9, 10, 11, and the failure/ignore handlers. Connections and zone/price tables stay put.

If the custom webhook does not yet list `lead_data.service_day`, Make may leave `{{1.lead_data.service_day}}` empty until the hook sees that key. After the first real or approved test post, confirm the field is available. Do not post a live test as part of writing this plan.

### 3.7 Patching Make before the site deploys must keep the old form working

Because the website PR is no-merge (and deploy is later), 6246200 may be patched while lawnsbytimmy.com still serves today's form. This patch is written to be backward-compatible:

| If the still-live old form posts… | Then 6246200 after this patch… |
|---|---|
| lot size + frequency (and ZIP) | Modules 5–6 and filters 3/9/7/10 behave exactly as today. Instant price still goes out when the pair prices. |
| `gate_width_inches` 48 or 30 | Access_Notes still writes `Gate: 48 in` / `Gate: 30 in`. Owner email still shows gate width. |
| `pets_secured` true | Owner email still shows it. |
| no `service_day` | Service_Day on the new row is blank. Owner email preferred-day line is blank. No error. |

Once the new form is deployed, the same mappers write Service_Day, leave Access_Notes blank, omit gate/pets on the owner email (plus the "asked after accept" note), and still auto-price from size + frequency.

---

## 4. Rollback

**Website PR (no merge):** opening the PR does not change lawnsbytimmy.com. Rollback is: do not merge, do not deploy, and close or leave the PR. If a later merge/deploy happens and must be undone, revert to `main` at `d648255` (or whatever HEAD was at PR time) and redeploy that, after Proof and Sisto's yes.

**6246200:** first restore from the **pre-patch backup** taken in §3.1 (unsanitized box backup, not the docs-bundle copy). For each patched module, `module_config_set` the **complete pre-change mapper**, with `expectedLastEdit` from a fresh GET after the forward patch. Restore at least module 2 (no `values.20`; original Access_Notes formula `Gate: {{1.lead_data.gate_width_inches}} in`) and module 4 (original body, no preferred-day line, original gate/pets lines). Confirm lastEdit, then have Proof read the live modules back against the pre-patch backup. Existing Customers rows written under the forward patch stay as they are (do not rewrite Service_Day on any row as part of rollback). The scenario should stay active unless a restore requires a brief pause that Sisto has approved.

**Do not** roll back 6671272, 6691639, Stripe, or RingCentral; this work does not change them.

---

## 5. Order of work (nothing in this list is authorized yet)

1. **Proof checks this plan** against the live homepage, GitHub `main` at `d648255` (or newer if main has moved), the Proof-passed two-question plan (`de5d2ad2…`), and the Nov 10 6246200 backup (modules sha `168a8ca0…`). No PR and no Make write on FIX, and none on PASS until step 2.
2. **Sisto's OK on the live change**, in his own words, including answers to the open questions in §7. An agent's say-so is not approval. Independently verify his typed turn.
3. **Website PR only, no merge, no deploy,** on `sistocervantes76-png/Lawnsbytimmy_website` from current `main`. Scope: the `index.html` edits in §2. Do not put webhook URLs in the PR body. CloudAgent / PR only; do not clone the repo onto the box to apply it. Send Sisto the PR link after it is open. Do not merge until a later explicit yes.
4. **6246200 patch** only after step 2, with the backup-first step, a fresh `expectedLastEdit`, the complete-mapper rule, and Proof readback of the live modules. Because the Make change is backward-compatible with the current form (§3.7), it can be applied before the website PR is merged without breaking instant quotes or gate/pets write-through for visitors still on the live form. If lastEdit has moved since the Nov 8 backup, stop and re-read.
5. After-ACCEPT questions (gate, pets, last cut; do not re-ask frequency or preferred day when those cells are already filled), ACCEPT go-live items 2–11, the offer-page / flow-server TEST app, and RingCentral campaign/templates stay out of scope until he says yes to those separately.

Until the after-ACCEPT step is live, new website leads will not have gate and pets collected automatically (the same collection-gap the Proof-passed plan already flagged).

---

## 6. What this is not

- Not a website PR, merge, or deploy (until the order in §5 is followed).
- Not a 6246200 change (until the same order).
- Not permission to send new kinds of customer texts, turn on ACCEPT, or change RingCentral itself.
- Not a Proof PASS of this apply plan (that check is still ahead).
- Not a change to the Proof-passed A/B plan `lawns-website-two-question-plan-2026-11-10.md` (`de5d2ad2…`); that file stays as it is.
- Not a change to 6671272 (already live with the Tue–Sat first text as of 8:20:34 PM ET).
- Not an apply of the superseded Option A plan.

---

## 7. Open questions (with sources)

Sisto's 8:39 PM ET pick, as relayed by Proof, is specifically: keep yard size and frequency for the instant price, and add the Tue–Sat day. It does not mention the card-on-file checkbox or add-ons. Neither item is a standalone, verified Sisto yes for this form change. Until he answers, the PR draft should keep both, matching the Proof-passed Option B field list.

### (a) Under B, does the card-on-file checkbox stay on the form, or move after accept?

**Not fully settled as a form-field decision.** Sources:

- **Keep, as the recommended Option B field list:** `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md` lines 217–220 (Proof PASS 8:26 PM ET, sha `de5d2ad2…`) lists "Card-on-file agreement (current required checkbox)" among the fields to keep under Option B. That is the plan recommendation Proof passed, not a later separate yes from Sisto on this checkbox.
- **Card-on-file belongs in the booking flow, but after the quote / at accept — not clearly "must stay on the quote form":** `/workspace/playbooks/lawns-booking-payment-playbook.md` lines 63 and 144 quote Sisto in Lawns chat, Nov 5, 2026, ~12:58 AM ET: "When a quote comes in, they get a text back with the amount… they can accept and pay for it or put their card on file to pay when it's done," and he picked "Send the payment link right away when they reply ACCEPT." The same playbook (line 147) says those words "do not by themselves establish every implementation detail (including requiring a card…)."
- **Recommendation only, Nov 5 quote-to-paid note:** `/workspace/proof-notes/lawns-quote-to-paid-complete-flow-2026-11-05.md` line 72: "Require card on file for per-visit (no charge at accept)? Rec: yes." That is a rec, not a recorded Sisto form decision.
- **Live site already treats card linking as after the quote:** `index.html` line 596 (How It Works step 2) and line 771 (FAQ: card collected during account setup). The live required checkbox is at lines 738–739 (`card_on_file_agreed`).

**Recommendation for the PR draft:** keep the required checkbox on the form (Proof-passed Option B list). The Nov 5 words support collecting a card in the accept/pay path; they do not require moving the agreement off this form. Ask him to confirm.

### (b) Do the add-ons stay on the form, or move after accept?

**Not settled by a Nov 4–5 billing decision.** Sources:

- **Keep, as the recommended Option B field list:** same two-question plan, line 217: "Keep Add-On Requests (optional) with the current three labels." Line 238 says the owner email may optionally include add-ons; lines 134 and 284 record the existing gap that `add_ons` is posted and never written to Services (column 12) or the owner email.
- **Same three add-ons appear on the TEST offer-page account screen as "Quoted," with no prices:** `/workspace/playbooks/lawns-offer-from-package-prices-2026-11-07.md` line 74. That describes the frozen offer page, not a decision to keep or drop them on the public quote form.
- No Nov 4–5 Sisto quote in the booking-payment playbook was found that says to collect (or not collect) aeration / shrub / cleanup on the website form.

**Recommendation for the PR draft:** keep the optional add-ons on the form (Proof-passed Option B list). Ask whether to start writing them to Services (column 12) and the owner email so they are not collected and then dropped. Do not map column 12 in the Make patch until he says to.
