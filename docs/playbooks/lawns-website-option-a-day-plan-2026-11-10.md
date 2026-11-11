# SUPERSEDED — Lawns website Option A + Tue–Sat day — exact change plan (history only)
Date: Tuesday, Nov 10, 2026, after 8:33 PM ET (America/New_York); banner added after 8:39 PM ET.

> **SUPERSEDED — do not apply.** Tuesday, Nov 10, 2026, **8:39 PM ET**, Sisto picked Option B on Proof's card in Proof's chat: "B: keep yard size and frequency for the instant price, add the Tue-Sat day." Lawns could not see the card pick itself in the transcript. This is recorded as **relayed by Proof** (Proof's 8:39 PM ET chat message to him states the switch from A to B). That pick supersedes his 8:32–8:33 PM ET Option A answers in Lawns chat. The current apply plan is `/workspace/playbooks/lawns-website-option-b-apply-plan-2026-11-10.md`. Nothing in this Option A file was applied (no PR, no 6246200 patch, no website change). Kept as history only.

Status: **SUPERSEDED. DRAFT ONLY. NOT APPLIED. NO PR. NOT DEPLOYED.** This is not the plan to apply.

**Do not publish:** webhook URLs (including `LEAD_WEBHOOK_URL` in `index.html`), connection IDs, keys, datastore IDs, spreadsheet IDs, or account emails other than info@lawnsbytimmy.com.

---

## 0. What Sisto chose at 8:32–8:33 PM ET (superseded at 8:39 PM ET)

Typed in Lawns chat, Tuesday Nov 10, 2026, 8:32–8:33 PM ET (card answers, relayed by Lawns). **These Option A answers are superseded** and are not the current direction. At 8:39 PM ET he picked Option B in Proof's chat (relayed by Proof); see the banner above and the Option B apply plan.

- First (superseded): Option A — only contact, address, and (at that moment) service; he prices web leads by hand.
- Then (superseded), after the stale "service" card was corrected: **Option A with the Tue–Sat day choice, matching the text.**

**Superseded 8:32–8:33 PM ET direction (no longer current):** that Option A draft would have kept contact info and address, added a required preferred-day field (Tue / Wed / Thu / Fri / Sat), and dropped lot size, frequency, gate, pets, and the auto-price. It was never applied.

This superseded draft is not approval to apply Option A or Option B.

Starting sources (read-only, this draft):

| Source | Result |
|---|---|
| Prior plan `/workspace/playbooks/lawns-website-two-question-plan-2026-11-10.md` (sha256 `de5d2ad2e4a49a191515c2856c8570ac7ad5c23dac87d5d009f73657a2ee1916`, Proof PASS 8:26 PM ET) | Option A / B draft. This document **was** the exact apply plan for Option A. It is **superseded** and is not the plan to apply. Option A is no longer the chosen direction. |
| 6246200 backup, Tue Nov 10, 2026, 7:51 PM ET | modules sha256 `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008`; scenario sha256 `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667`. Name LBT_Quote, status active, lastEdit Sunday Nov 8, 2026, 6:04:55 PM ET (`2026-11-08T23:04:55.154Z`). Re-GET lastEdit immediately before any later patch. |
| Live site `https://lawnsbytimmy.com/` fetched Tue Nov 10, 2026, 8:33 PM ET | HTTP 200, 28,181 bytes, sha256 `8183b85bb4117190d90dfbd3ad5ae37a4d26177e98868d9d101d7c241ee2ff8b`. One quote form (`#leadForm` / `#quote-form`). Same size, fields, and payload keys as the prior inspect. |
| GitHub `sistocervantes76-png/Lawnsbytimmy_website`, branch `main` (read-only MCP) | HEAD still `d6482556807a165aa38793dbfe93085c272e65cf` (Thu Nov 5, 2026, 7:49 AM ET, "Add a Substack signup section… (#13)"). `index.html` blob sha `fceb4ff483c79f248bf2863cf67bf6aedc4068c4`, size 28,181 bytes. Public repo. The quote form lives only in `index.html`. The Worker (`src/worker.js`) only handles `/api/account/*`. |

The form posts JSON `{ event: "lead_form_submitted", timestamp, lead_data: { … } }` to the Make custom webhook that triggers **LBT_Quote (6246200)**. Do not publish or change that URL.

---

## 1. Exact form field changes (`index.html`)

The public homepage is the only lead form. Do not change `src/worker.js`, `/account/`, `terms.html`, or `privacy.html` in this work, except to fix any leftover "instant quote / price in about a minute" wording if a later scan finds it there. SMS consent and footer 10DLC language stay exactly as they are.

Posted values for the day field must be the abbreviated weekdays already used in Service_Day: **Tue, Wed, Thu, Fri, Sat**. Do not offer Mon or Sun. Do not post "Tuesday" or "Tue-Sat".

### 1.1 Keep (same labels, required flags, and values as live)

| Label | HTML name | Required? | Values / notes |
|---|---|---|---|
| First Name | `first_name` | Yes | text |
| Last Name | `last_name` | Yes | text |
| Cell Phone | `phone` | Yes | tel |
| Email | `email` | Yes | email |
| SMS consent checkbox (current full 10DLC / STOP language, Privacy and Terms links) | `sms_consent` | No | checkbox; post boolean `true` only if checked |
| Service Address | `service_address` | Yes | text |
| City | `city` | Yes | Oakland Park, Fort Lauderdale, Wilton Manors (same options) |
| Zip Code | `zip` | Yes | 5 digits |

### 1.2 Add (required)

| Label (proposed) | HTML name | Required? | Values |
|---|---|---|---|
| Which day works best (Tue-Sat)? | `service_day` | **Yes** | Radio or select. Posted values exactly: `Tue`, `Wed`, `Thu`, `Fri`, `Sat`. Visible labels may be Tuesday…Saturday as long as the posted value is the three-letter form. |

Payload: add `lead_data.service_day`. Use this same key in 6246200 (`{{1.lead_data.service_day}}`). Do not also invent a second key (`preferred_day`) unless the form and Make are changed together later.

### 1.3 Remove from the form and from the payload

Do not leave hidden inputs. Do not post a silent default (`Bi-Weekly`, `Not sure`, `pets_secured: false`, `gate_width_inches: null`). A leftover default would either auto-price a frequency he did not choose or write a misleading pets/gate value.

| Label (live today) | HTML name | Live required? | Why it comes off |
|---|---|---|---|
| Gate Clearance Width (36" or wider → `48`; standard walk gate → `30`) | `gate_width` (payload `gate_width_inches`) | Yes | Asked after they accept, once that step is live |
| "I confirm pets will be secured indoors…" | `pets_secured` | Yes (must check) | Same. Do not post `false`. |
| Service Frequency (Bi-Weekly Mowing / Monthly Mowing) | `frequency` | Yes | Needed for auto-price, which Option A turns off |
| Lawn size (grass area only), including Not sure | `lot_size` | Yes | Same |

### 1.4 Open questions (do not guess at apply time)

**Q1. Card-on-file checkbox — unresolved.** Live label: "I agree to securely link a card on file for automated billing once my quote is confirmed. No service is scheduled without a card on file." It is **required** today. Payload key: `card_on_file_agreed`. It is not written to the Customers row (Card_On_File is column 19 and is unmapped). It only appears on the module 4 owner email.

Recommendation, not a decision: **move it off the form** with the other after-accept questions, because there is no instant bookable price on this path. FAQ billing copy ("We collect a card on file during account setup") can stay. Until Sisto answers, the PR draft should follow this recommendation and say so in the PR body (no webhook URLs). If he wants it kept, leave the checkbox required and keep it on the owner email.

**Q2. Add-On Requests (optional) — unresolved.** Live optional checkboxes: Core Aeration ($150); Shrub & Bed Maintenance; Seasonal Property Cleanup. Posted as `add_ons` (array). Not written to Services (column 12) or the owner email today (existing gap). Sisto did not mention add-ons when he chose Option A.

Recommendation, not a decision: **move add-ons after accept** as well, so the form is contact + address + day only. Alternative: keep them optional up front, and this time map them into Services (column 12) and the owner email so they are not collected and dropped. Until he answers, the PR draft should follow the "move after accept" recommendation.

### 1.5 Copy that must change (instant price would be false)

Live strings to replace in `index.html` (hero, How It Works, form heading, button, success box, and the submit-button reset text in the script):

| Live copy | Proposed replacement |
|---|---|
| Value prop title: "Instant Quoting" | "Request a Quote" |
| "Pick your yard size and get your per-visit price by email in about a minute. No waiting for an estimator." | "Tell us your address and which day works best (Tue-Sat). Timmy will review your request and send your price by email or text." |
| Hero / form button and header CTA: "Get My Instant Quote" | "Request a Quote" |
| How It Works step 1 title: "Get Your Instant Price" | "Request a Quote" |
| Step 1 body: "Submit your address and property details in 60 seconds." | "Submit your name, address, and preferred day (Tue-Sat)." |
| Step 2 title can stay "Lock In Your Route Day" | Body should not imply the quote is already priced. Proposed: "Timmy will send your price, then we'll confirm your day. Gate clearance and a card on file are handled after you accept." |
| Section title "Get My Instant Quote" | "Request a Quote" |
| "Tell us about your property and we'll email you your price in about a minute." | "Tell us your address and which day works best (Tue-Sat). Timmy will email or text you a price." |
| Success: "Thank you! Check your email. Your price is on its way, usually within a minute." | "Thank you! We got your request. Timmy will review it and email or text you a price." |
| Script button reset: "Get My Instant Quote" | "Request a Quote" |

Meta description still says "Instant price quotes" — change it in the same PR so the tab/snippet does not promise an instant price.

Module 11 (webhook respond) body is `"Thank you! Check your email"` and is not what the green success box shows (the page JS does not read that message). Optional, same PR window: change it to the new thank-you sense for consistency. Not required for the form to work.

### 1.6 JavaScript payload after the change

Keep `event` and `timestamp`. `lead_data` should include: `first_name`, `last_name`, `phone`, `sms_consent`, `email`, `service_address`, `city`, `zip`, `service_day`, and (only if Q1/Q2 are kept on the form) `card_on_file_agreed` / `add_ons`.

Omit: `lot_size`, `frequency`, `gate_width_inches`, `pets_secured`.

---

## 2. Exact 6246200 module changes

6246200 is the website-quote scenario only. Missed-call leads do not go through it. Do not change prices, zone lists, connections, or the webhook URL.

`scenario_patch` `module_config_set` **replaces the whole mapper**. For every module you touch, send the **complete current mapper** (every key, including unchanged connection, spreadsheet, from/to, headers, and restore-unrelated fields that belong in the mapper), plus **`expectedLastEdit`** from a fresh `scenario_get` taken immediately before the patch. If lastEdit does not match, stop and re-read. Do not publish connection IDs, spreadsheet IDs, or hook URLs in the PR or in this plan's apply notes.

Re-backup 6246200 (scenario + every module) immediately before the patch. Do not use the sanitized docs-bundle JSON as a restore source (IDs are placeholders).

### 2.1 Module 2 — Customers `addRow` (this is an append, not an update)

This module **inserts a new row** (`insertDataOption: INSERT_ROWS`) when the "Real lead (has email or phone)" filter passes. That filter is unchanged: email contains `@`, OR digits-only phone length ≥ 10. Day, lot size, frequency, gate, and pets are not in it, so dropping those fields does not block the CRM row.

Current mapped indexes (0-based, `useColumnHeaders` false): 0–11, 13–16, and 22. Unmapped among 0–23: 12 (Services), 17–21 (including **Service_Day at 20**), 23 (Notes).

Headers (for reference): 0 Customer_ID, 1 Date_Added, 2 Status, 3 First_Name, 4 Last_Name, 5 Phone, 6 Email, 7 Service_Address, 8 City, 9 Zip, 10 Lot_Size, 11 Frequency, 12 Services, 13 Price_Per_Visit, 14 Monthly_Total, 15 Access_Notes, 16 SMS_Consent, 19 Card_On_File, **20 Service_Day**, 21 Next_Service_Date, 22 Lead_Source, 23 Notes.

**Required mapper edits** (keep every other `values.*` entry as it is, including Customer_ID with seconds, Status `New Lead`, Lead_Source `Website Form`):

1. **Add `values.20`:** `{{1.lead_data.service_day}}` — this is the only write of preferred day into the sheet. Do not put the day in Services (12) or Notes (23).
2. **Keep `values.10` and `values.11`** mapped to `lot_size` and `frequency`. On the new form those keys are omitted, so the new row's Lot_Size and Frequency stay **blank**. Do not delete the mappings: if Make is patched while the current form is still live, those answers would still be written. Do not write a default size or frequency.
3. **Keep `values.13` and `values.14`** as they are. They already write a price only when zone ≠ 3 and `base` > 0; otherwise they are blank, not $0. After Option A, new-form leads have `base` 0, so prices stay blank for Timmy to fill by hand.
4. **Change `values.15` (Access_Notes).** Live formula is `Gate: {{1.lead_data.gate_width_inches}} in`. If gate is omitted that becomes the broken string `Gate:  in`. New formula must write the gate line only when `gate_width_inches` is present, and write a blank cell when it is not. Intent (confirm Make syntax at apply time): if `1.lead_data.gate_width_inches` is empty, `emptystring`; else `Gate: {inches} in`.

Do not add mappings for columns 12, 17–19, 21, or 23 unless Sisto chooses to keep add-ons and we then map them to column 12.

**Service_Day already has values on existing customers. New leads must not overwrite them.** Five Active Recurring rows already have Wed or Thu in Service_Day (same abbreviation style). Later rows are blank. 6246200 module 2, 6671272 module 8, and 6618999 do not write `values.20` today. Because module 2 is **addRow only**, mapping `values.20` writes the new lead's day onto a **new** Website Form row. It does not update existing rows and cannot overwrite those five Active Recurring cells. This work must also **not** introduce a search-and-update, `updateRow`, or bulk write to column 20, and must not start writing Service_Day from 6671272 or 6618999.

### 2.2 Modules 5–6 — do not break on missing lot size / frequency; do not auto-price the new form

Module 5 `key` is the first word of `lot_size` (trim, lower) plus `frequency` (trim, lower, hyphens and spaces stripped). Module 6 `base` is a switch on that key; **anything else, including a missing pair or "Not sure," is 0**. Zone and trip still come only from the 5-digit ZIP (still collected). Gate, pets, add-ons, and `service_day` are not inputs to `key`, `base`, `zone`, or `trip`.

With lot size and frequency omitted, `key` will not match a priced pair, `base` will be 0, and priced customer routes will not run. **Do not add a silent default frequency** to keep auto-price.

**Required safety wrap on module 5** (complete mapper: all three variables, `key` / `zip5` / `summer`; only `key` changes). Today's `key` calls `first(split(trim(1.lead_data.lot_size); " "))` and `trim(1.lead_data.frequency)`. If either field is missing, those functions might error and stop the scenario before the CRM row or any email. The new `key` must treat a missing or blank `lot_size` or `frequency` as an empty string so the module always completes. If both are empty, `key` is empty and module 6 already defaults `base` to 0. Leave the module 6 `base` / `zone` / `trip` switch **unchanged**.

Do **not** force `base` = 0 for every 6246200 run. 6246200 is website-only, but the live form will still post size + frequency until the website change is deployed. Leaving the switch in place means: old form still auto-prices; new form (no size/frequency) always gets `base` 0 and the hand-quote path. That is what makes it safe to open the PR (no merge) and, if he says yes, patch Make before the new form is deployed.

### 2.3 Router: every new-form lead goes to the hand-confirm path; no customer price text or $0 price email

Live filters (do not loosen them):

- Module 3 (priced customer email) and module 9 (priced customer SMS): zone ≠ 3 AND `base` > 0, plus email / SMS-consent+phone. Copy includes `${base+trip} per visit`. These must **not** fire for Option A leads. With `base` 0 they already will not. Do not change these filters. Do not change module 3 or 9 wording in this work (they stay for any still-live old-form priced lead, and for rollback).
- Module 7 (confirm email) and module 10 (confirm SMS): (zone = 3) OR (`base` = 0), plus email / SMS-consent+phone. This is the hand-quote path. New-form leads with an email go to module 7; those with SMS consent and a phone go to module 10. They do not receive a dollar amount, and they do not receive a "$0" price. The "$0" problem today is only on the **owner** email (module 4), not on the customer priced modules (those are filtered off).

**Required wording changes on the confirm path** (complete mappers: to, content, subject, bodyType). Today's module 7 body says "You're just outside our regular route, so we'll confirm your price within 1 business day." That sentence is wrong for in-zone leads who simply were not auto-priced. Module 10 says "We got your request and will confirm your price within 1 business day."

Proposed customer email (module 7) — subject can stay "Lawns by Timmy: we got your request, {first_name}":

> Hi {first_name}, Thanks for your request for **{address}, {city}**. We got it, including your preferred day ({service_day}). Timmy will confirm your price by hand and we'll email or text you a quote. Want it faster? Reply with 2 or 3 photos of your yard (front and back). Thank you, Sisto, Lawns by Timmy.

Proposed customer SMS (module 10) — keep the STOP line:

> Hi {first_name}, thanks for reaching out to Lawns by Timmy! We got your request for {service_day} and Timmy will confirm your price by hand. Want it faster? Reply with 2-3 photos of your yard. Reply STOP to opt out.

These two customer texts are **proposed**. They go out only after Proof PASSes them and Sisto says yes. If he wants different words, substitute his words and keep the same routing.

Failure emails 24 and 28 (handlers for 7 and 10) should say the hand-confirm message failed, include preferred day, and should not imply a quoted dollar amount. Failure emails 22 and 26 stay as they are (they only run if a priced send fails; that should not happen for new-form leads). Mention preferred day on 24/28 so Timmy has it if the customer never got the confirm message.

### 2.4 Module 4 — owner email: no "Price quoted: $0"

Always sends today after the CRM row. Live body lists lot size, frequency, gate width, pets secured, card-on-file, zone, and **Price quoted: ${base+trip} per visit**. If `base` is 0 that line says **$0** even though the customer was not quoted $0. That must stop.

Required content changes (complete mapper: to, content, subject, bodyType). Keep the "NO EMAIL ON FORM" warning and the contact block. Then:

- Add: Preferred day: `{{1.lead_data.service_day}}`
- Lot size / frequency: show only if present; otherwise say they were not collected (Timmy will price by hand).
- Gate / pets: show only if present; otherwise say they will be asked after the customer accepts (once that step is live).
- Card-on-file line: keep only if Q1 stays on the form; otherwise drop or say it will be asked after accept.
- Add-ons line: only if Q2 stays on the form.
- **Replace** "Price quoted: ${{sum(6.base; 6.trip)}} per visit …" with: Zone {zone}. **No automatic price was sent.** Timmy will confirm the price by hand and send the quote. (If this patch lands while the old form is still live and `base` > 0, also show the automatic price that was sent, so Timmy is not told "no price" on a lead who just received one. Suggested switch: if `base` > 0 and zone ≠ 3, "Price quoted: ${base+trip} per visit (trip fee ${trip})"; else "No automatic price was sent. Timmy will confirm the price by hand.")

Subject can stay "New lead: {name} - {city}" with the no-email suffix.

### 2.5 Modules not changed

Module 1 (webhook), module 8 (router structure), modules 3, 9, 22, 23, 26, 27, and (except the optional thank-you tweak) module 11. Connections and zone/price tables stay put.

If the custom webhook does not yet list `lead_data.service_day`, Make may leave `{{1.lead_data.service_day}}` empty until the hook sees that key. After the first real or approved test post, confirm the field is available. Do not post a live test as part of writing this plan.

---

## 3. Missing lot size / frequency will not break modules 5–6 or the CRM row

| Check | Why it holds, if the changes above are applied |
|---|---|
| Module 5 does not error on blank size/frequency | Safety wrap in §2.2. |
| Module 6 still returns a number | Default `base` is already 0; switch is unchanged. |
| CRM row still writes | Module 2 filter does not use size, frequency, gate, pets, or day. addRow still runs for a real email or 10-digit phone. Lot_Size, Frequency, Price_Per_Visit, and Monthly_Total are blank, not "$0". Access_Notes is blank rather than `Gate:  in`. Service_Day is filled from the form. |
| Customer is not quoted $0 | Modules 3 and 9 require `base` > 0. Module 4 no longer prints $0 as a quoted price. |
| Customer still hears from us | Module 7 and/or 10 on the `base` = 0 path, with the hand-confirm wording. |

Later, TEST `flow-server.mjs` will not auto-send an ACCEPT pay link for these rows until Timmy fills Lot_Size, Frequency, and Price_Per_Visit by hand. ACCEPT is not live; this is a consequence, not a change in this work.

---

## 4. Rollback

**Website PR (no merge):** opening the PR does not change lawnsbytimmy.com. Rollback is: do not merge, do not deploy, and close or leave the PR. If a later merge/deploy happens and must be undone, revert to `main` at `d648255` (or whatever HEAD was at PR time) and redeploy that, after Proof and Sisto's yes.

**6246200:** restore each patched module with `module_config_set`, sending the **complete pre-change mapper** from the pre-patch backup (the unsanitized box backup, not the docs-bundle copy), with `expectedLastEdit` from a fresh GET after the forward patch. Restore module 2 (including no `values.20`, and the original Access_Notes formula), module 5 `key`, module 4, modules 7 and 10, and 24/28 if they were changed. Confirm lastEdit, then have Proof read the live modules back against the pre-patch backup. Existing Customers rows written under Option A stay as they are (do not rewrite Service_Day on any row as part of rollback). The scenario should stay active unless a restore requires a brief pause that Sisto has approved.

**Do not** roll back 6671272, 6691639, Stripe, or RingCentral; this work does not change them.

---

## 5. Order of work (nothing in this list is authorized yet)

1. **Proof checks this plan** against the live homepage, GitHub `main` at `d648255` (or newer if main has moved), and the Nov 10 6246200 backup (modules sha `168a8ca0…`). No PR and no Make write on FIX, and none on PASS until step 2.
2. **Sisto's yes** in his own words, including answers to Q1 (card-on-file) and Q2 (add-ons), and sign-off on the proposed module 7 / 10 wording (or his replacement words). An agent's say-so is not approval.
3. **Website PR only, no merge, no deploy,** on `sistocervantes76-png/Lawnsbytimmy_website` from current `main`. Scope: `index.html` form, payload, and copy in §1. Do not put webhook URLs in the PR body. CloudAgent / PR only; do not clone the repo onto the box to apply it. Send Sisto the PR link after it is open. Do not merge until a later explicit yes.
4. **6246200 patch** only after step 2, with a fresh backup, fresh `expectedLastEdit`, the complete-mapper rule, and Proof readback of the live modules. Because the Make change is backward-compatible with the current form (§2.2), it can be applied before the website PR is merged without turning off instant quotes for visitors still on the live form, and without writing `Gate:  in` or $0 on new-form leads once the form is deployed. If lastEdit has moved since the Nov 8 backup, stop and re-read.
5. After-ACCEPT questions, ACCEPT go-live items 2–11, the offer-page / flow-server TEST app, RingCentral campaign/templates, and any customer SMS beyond what 6246200 already sends on this path stay out of scope until he says yes to those separately.

### Live vs this plan

| Piece | State now | After this plan is applied (PR merged + Make patched) |
|---|---|---|
| Homepage form | Full fields, instant-quote copy, posts to 6246200 | Contact, address, required Tue–Sat day; no size/frequency/gate/pets; no instant-price copy |
| 6246200 auto-price | Live from lot size + frequency | Off for new-form leads; Timmy prices by hand; confirm email/SMS on the hand path |
| Service_Day on new website leads | Unmapped (blank) | Written from the form (values.20) |
| Service_Day on the five existing Active Recurring rows | Wed or Thu already there | Unchanged (addRow only) |
| After-ACCEPT questions / pay link | Not live | Still not live |
| Offer-page / flow-server | TEST only | Unchanged |

---

## 6. What this is not

- Not a website PR, merge, or deploy (until the order in §5 is followed).
- Not a 6246200 change (until the same order).
- Not permission to send new kinds of customer texts, turn on ACCEPT, or change RingCentral itself. Quote SMS wording for this path lives in 6246200 modules 9 and 10.
- Not a Proof PASS of this plan (that check is still ahead).
- Not a change to 6671272 (already live with the Tue–Sat first text as of 8:20:34 PM ET).

## Open questions for Sisto (needed before apply)

1. Keep the required card-on-file checkbox on the form, or move it until after they accept? (Recommendation: move it.)
2. Keep the optional add-on checkboxes on the form (and start writing them to Services / the owner email), or move those after accept too? (Recommendation: move them.)
3. Is the proposed "Timmy will confirm your price by hand" email and SMS wording in §2.3 OK, or does he want different words?
