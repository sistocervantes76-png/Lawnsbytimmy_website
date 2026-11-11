# Lawns website Option B apply plan — keep instant price, add Tue–Sat day
Date: Tuesday, Nov 10, 2026, after 8:39 PM ET (America/New_York); revised after Proof's 8:47 PM ET FIX.
Status: **DRAFT ONLY. NOT APPLIED. NO MERGE. NOT DEPLOYED.** Revised for Proof's FIX (module 4 body, apply order, settled form fields). Pending Proof's recheck, then Sisto's OK in his own words on making Option B and the 6246200 change live. This document does not change the website, Make, or the repo.

**Do not publish:** webhook URLs (including `LEAD_WEBHOOK_URL` in `index.html`), connection IDs, keys, datastore IDs, spreadsheet IDs, or account emails other than info@lawnsbytimmy.com.

---

## 0. Sisto's choice (current vs superseded)

**Current direction, Tuesday Nov 10, 2026, 8:39 PM ET — recorded as relayed by Proof.** Sisto picked Option B on Proof's card in Proof's chat: **"B: keep yard size and frequency for the instant price, add the Tue-Sat day."** Lawns could not see the card pick itself in the transcript. Proof's 8:39 PM ET chat message to him states the switch from A to B. This plan treats that relayed 8:39 PM ET pick as the chosen direction.

**Superseded, 8:32–8:33 PM ET, Lawns chat (card answers, relayed by Lawns).** He first picked Option A (contact, address, and at that moment "service"; he prices web leads by hand), then "Option A with the Tue-Sat day choice, matching the text." Those answers are no longer current. The Option A apply plan `/workspace/playbooks/lawns-website-option-a-day-plan-2026-11-10.md` is shelved as history (SUPERSEDED banner) and must not be applied.

This 8:39 PM ET pick is the direction, not approval to change the live site or 6246200. The only remaining question for Sisto is whether to make Option B and the 6246200 mapping change live, in his own words. Apply only after Proof PASSes this revised plan and he gives that yes.

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

### 1.4 Card-on-file and add-ons (settled for this patch)

Both stay **exactly as they are on the live form**, per Proof's 8:47 PM ET check and the Proof-passed Option B field list (two-question plan lines 217–220). No keep-or-move question is needed, and this does not block Sisto's yes on the live change.

- The required card-on-file checkbox (`card_on_file_agreed`, live `index.html` lines 738–739) stays on the form and in the payload. The module 4 owner email keeps the "Agreed to card on file" line.
- The optional Add-On Requests (`add_ons`, the current three labels) stay on the form and in the payload (`data.getAll('add_ons')`, line 853). They are **collected today and then dropped**: 6246200 module 2 does not map Services (`values.12`), and module 4 does not mention add-ons. Writing add-ons to Services column 12 and the owner email is **later cleanup, not part of this patch**, so the live change stays small.

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

Keep `add_ons` and `card_on_file_agreed` exactly as they are, and keep `const addOns = data.getAll('add_ons');` (line 853). Do not move or remove them in this PR.

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

Do not map add-ons into Services (`values.12`) in this patch. They stay on the form and in the payload, and they will still be collected and then dropped until a later cleanup writes them to column 12 and the owner email.

### 3.3 Modules 5 and 6 — auto-price unchanged

Leave both mappers exactly as they are. Module 5 `key` stays the first word of `lot_size` (trim, lower) plus `frequency` (trim, lower, hyphens and spaces stripped). Module 6 `base` / `zone` / `trip` stay the same switch. Gate, pets, add-ons, and `service_day` are not inputs to `key`, `base`, `zone`, or `trip`. Known size + frequency pairs in zones 1–2 still auto-price (including summer monthly amounts and the $10 zone-2 trip). "Not sure" and zone 3 still use the confirm path (modules 7 and 10).

Do not add a default frequency or lot size. Do not force `base` = 0.

### 3.4 Missing gate or pets must not error any module or filter, including 3 and 9

Today, only module 2 (`values.15`) and module 4 (owner-email lines "Gate width: …" and "Pets secured: …") read those fields. Modules 3 and 9 (priced customer email and SMS) do **not** reference gate or pets in their filters or copy. Modules 5, 6, 7, 10, 11, and the failure emails 22/24/26/28 also do not. Do not add gate or pets to those modules.

- Filters for modules 3 and 9 stay: zone ≠ 3 AND `base` > 0, plus email / SMS-consent+phone. Missing gate or pets cannot fail those filters.
- After the form change, the payload simply omits the two keys. Module 2's new Access_Notes formula (§3.2) and module 4's conditional lines (§3.5) treat empty as blank text, not an error.
- Do not post `pets_secured: false`.

### 3.5 Module 4 — complete replacement mapper (ready to paste)

Always sends today after the CRM row. `scenario_patch` `module_config_set` needs the **complete** mapper. `to`, `subject`, and `bodyType` are unchanged. The connection stays as it is (do not publish it). Only `content` changes, as pasted below.

Unchanged mapper fields (paste as-is):

- `to`: `info@lawnsbytimmy.com`
- `bodyType`: `rawHtml`
- `subject`:

```
New lead: {{1.lead_data.first_name}} {{1.lead_data.last_name}} - {{1.lead_data.city}}{{if(contains(1.lead_data.email; "@"); emptystring; " (NO EMAIL - contact them)")}}
```

**Static sentence when gate and pets are both missing** (new-form posts). This does not say ACCEPT or the after-accept questions are live; those steps are TEST only and are not built:

```
Gate and pets were not asked on the form; confirm them with the customer
```

**Exact Make formula** (three parts, used inside `content` below):

1. If `gate_width_inches` is present, print today's gate line; otherwise print nothing: `{{if(empty(1.lead_data.gate_width_inches); emptystring; "Gate width: " + 1.lead_data.gate_width_inches + " in<br>")}}`
2. If `pets_secured` is present, print today's pets line; otherwise print nothing: `{{if(empty(1.lead_data.pets_secured); emptystring; "Pets secured: " + 1.lead_data.pets_secured + "<br>")}}`
3. If **both** keys are empty, print the static sentence once; otherwise print nothing: `{{if(empty(1.lead_data.gate_width_inches); if(empty(1.lead_data.pets_secured); "Gate and pets were not asked on the form; confirm them with the customer<br>"; emptystring); emptystring)}}`

Old-form posts (gate 48 or 30, and pets present) still get today's "Gate width" and "Pets secured" lines and do not get the static sentence. New-form posts (both keys omitted) get the static sentence once, not blank "Gate width:  in" / "Pets secured: " lines. ACCEPT and the after-accept questions stay TEST-only / not built; this sentence only tells Timmy to confirm gate and pets with the customer.

**Complete replacement `content`** (paste this entire block into module 4; line breaks are the same CRLF style as the live body). It keeps the "NO EMAIL ON FORM" warning, the contact block, lot size, frequency, zone, the "Price quoted: ${{sum(6.base; 6.trip)}} per visit" line, and the card-on-file line. It adds the preferred-day line and the formulas above:

```
<p><strong>New website lead</strong></p>
{{if(contains(1.lead_data.email; "@"); emptystring; "<p><strong>NO EMAIL ON FORM.</strong> This customer did NOT get an email from us. Call or text them.</p>")}}
<p>Name: {{1.lead_data.first_name}} {{1.lead_data.last_name}}<br>
Phone: {{1.lead_data.phone}}<br>
OK to text: {{if(1.lead_data.sms_consent; "Yes"; "No (call or email only)")}}<br>
Email: {{1.lead_data.email}}<br>
Address: {{1.lead_data.service_address}}, {{1.lead_data.city}} {{1.lead_data.zip}}<br>
Lot size: {{1.lead_data.lot_size}}<br>
Frequency: {{1.lead_data.frequency}}<br>
Preferred day: {{1.lead_data.service_day}}<br>
{{if(empty(1.lead_data.gate_width_inches); emptystring; "Gate width: " + 1.lead_data.gate_width_inches + " in<br>")}}{{if(empty(1.lead_data.pets_secured); emptystring; "Pets secured: " + 1.lead_data.pets_secured + "<br>")}}{{if(empty(1.lead_data.gate_width_inches); if(empty(1.lead_data.pets_secured); "Gate and pets were not asked on the form; confirm them with the customer<br>"; emptystring); emptystring)}}Agreed to card on file: {{1.lead_data.card_on_file_agreed}}</p>
<p><strong>Zone {{6.zone}}</strong>. Price quoted: ${{sum(6.base; 6.trip)}} per visit (trip fee ${{6.trip}}).<br>If Zone 3 or price shows $0, the customer got a "we'll confirm your price" message instead. Next: send them the price.</p>
```

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

Once the new form is deployed, the same mappers write Service_Day, leave Access_Notes blank, put the static "Gate and pets were not asked on the form; confirm them with the customer" sentence on the owner email, and still auto-price from size + frequency.

---

## 4. Rollback

**Website PR (no merge):** opening the PR does not change lawnsbytimmy.com. Rollback is: do not merge, do not deploy, and close or leave the PR. If a later merge/deploy happens and must be undone, revert to `main` at `d648255` (or whatever HEAD was at PR time) and redeploy that, after Proof and Sisto's yes.

**6246200:** first restore from the **pre-patch backup** taken in §3.1 (unsanitized box backup, not the docs-bundle copy). For each patched module, `module_config_set` the **complete pre-change mapper**, with `expectedLastEdit` from a fresh GET after the forward patch. Restore at least module 2 (no `values.20`; original Access_Notes formula `Gate: {{1.lead_data.gate_width_inches}} in`) and module 4 (original body, no preferred-day line, original gate/pets lines). Confirm lastEdit, then have Proof read the live modules back against the pre-patch backup. Existing Customers rows written under the forward patch stay as they are (do not rewrite Service_Day on any row as part of rollback). The scenario should stay active unless a restore requires a brief pause that Sisto has approved.

**Do not** roll back 6671272, 6691639, Stripe, or RingCentral; this work does not change them.

---

## 5. Order of work (nothing in this list is authorized yet)

**Required sequence for the live change:** first back up 6246200, then patch 6246200 live, then Proof reads the live modules back. **Only after that readback may the website PR be merged or deployed.**

Why the site must not go first: if the new form went live on the current 6246200 config, module 2 would still write Access_Notes as `Gate:  in`, `service_day` would be collected on the form and then dropped (no `values.20`, and no preferred-day line on the owner email), and the owner email would still print blank "Gate width:  in" and "Pets secured: " lines. The Make patch is backward-compatible with the old form (§3.7), so it can go live first without breaking instant quotes or gate/pets write-through for visitors still on today's homepage.

1. **Proof rechecks this revised plan.** No Make write, and no merge or deploy, on FIX, and none on PASS until step 2.
2. **Sisto's OK**, in his own words, on making the Option B form and the 6246200 mapping change live. That is the only remaining question for him. An agent's say-so is not approval. Independently verify his typed turn. The 8:39 PM ET B pick is the direction, not this live-change yes. Do not block this step on card-on-file or add-ons questions; those stay as they are (§1.4, §7).
3. **Back up live 6246200 first** (§3.1): full unsanitized scenario + every module, sha256 sidecars, and the current `lastEdit`.
4. **Patch 6246200 live** with `module_config_set`, the complete mapper for each touched module (module 2 and module 4), and a fresh `expectedLastEdit` from a GET immediately before the patch. If lastEdit has moved, stop and re-read.
5. **Proof reads the live modules back** against the pre-patch backup and this plan. Do not merge or deploy the website until this readback is a PASS.
6. **Only after step 5:** merge or deploy the website PR (`index.html` edits in §2). Opening a PR with no merge and no deploy does not change the live site and may happen earlier; it still must not be merged or deployed before step 5. Do not put webhook URLs in the PR body. CloudAgent / PR only; do not clone the repo onto the box to apply it.
7. After-accept questions (gate, pets, last cut; do not re-ask frequency or preferred day when those cells are already filled), ACCEPT go-live items 2–11, the offer-page / flow-server TEST app, and RingCentral campaign/templates stay out of scope. ACCEPT and those follow-up questions are **TEST only and are not built**; they are not turned on by this work.

New website leads will not have gate and pets collected automatically until a later, separately approved step is built. Until then, the owner email uses the static sentence in §3.5 so Timmy can confirm them with the customer.

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

## 7. Settled for this patch, and the only remaining question for Sisto

The card-on-file checkbox and the optional add-ons are **not** open questions. Both stay exactly as they are on the live form, per Proof's 8:47 PM ET check and the Proof-passed Option B field list (two-question plan lines 217–220). Do not ask Sisto a keep-or-move question to leave them where they are, and do not block his yes on the live B change on either item.

- **Card-on-file:** the required checkbox stays on the form and in the payload. Module 4 keeps the "Agreed to card on file" line (§3.5).
- **Add-ons:** the three optional checkboxes stay on the form and in the payload. They are currently **collected and then dropped** (no `values.12`, no owner-email line). Writing add-ons to Services column 12 and the owner email is **later cleanup, not part of this patch**, so the live change stays small. That cleanup is Lawns' to do later; it is not a question for Sisto in this apply plan.

**The only remaining question for Sisto**, after this revised plan is rechecked, is whether to make the Option B form and the 6246200 mapping change live. That yes has to be in his own words and independently verified. An agent's say-so is not approval. The 8:39 PM ET B pick is the direction, not that live-change yes.
