# Lawns website two-question plan
Date: Tuesday, Nov 10, 2026, 8:10 PM ET (America/New_York); revised 8:20 PM ET after the live missed-call first text changed to address + preferred day (Tue-Sat).
Status: **DRAFT ONLY. NOT APPLIED. NO PR. NOT DEPLOYED.** Read-only inspect of the live site, the GitHub repo, the Nov 10 6246200 backup, the frozen offer-page build, and flow-server.mjs. This revision does not change the website or 6246200. No webhook URL, connection ID, spreadsheet ID, key, or secret is published here.

**Source of the request:** Sisto typed in Lawns chat, Tuesday Nov 10, 2026, 8:06 PM ET (t40u): "make sure the website follows suit also and the app that connects the customerss after they accept quote is it still at payload."

"Follow suit" now means the lawnsbytimmy.com quote/lead form should match the live missed-call first text (applied v2, Tue Nov 10, 2026, 8:20:34 PM ET): ask address and preferred day (Tue-Sat) up front; move gate, pets, frequency, and last cut to after they accept. The earlier draft of this plan used "what service do you need?" because that was the live missed-call pair from 8:07 PM ET; that question is no longer the follow-suit item. Context: `/workspace/playbooks/lawns-missed-call-two-question-plan-2026-11-10.md` (Applied v2) and apply notes `/workspace/proof-notes/lawns-missed-call-address-day-apply-2026-11-10.md`.

This plan is not approval to change the website, to change 6246200, to open a pull request, to deploy, to send texts, or to turn on ACCEPT. Another executor was applying the live 6671272 first-text change at the same time; this work did not touch Make.

**Do not publish:** webhook URLs (including `LEAD_WEBHOOK_URL` in `index.html`), connection IDs, keys, datastore IDs, spreadsheet IDs, or account emails.

---

## 1. What was inspected (read-only)

| Source | What it is | Result |
|---|---|---|
| Live site `https://lawnsbytimmy.com/` | Homepage HTML fetched Tuesday, Nov 10, 2026, 8:07–8:10 PM ET | HTTP 200, 28,181 bytes, sha256 `8183b85bb4117190d90dfbd3ad5ae37a4d26177e98868d9d101d7c241ee2ff8b`. One quote form (`#leadForm` / `#quote-form`). |
| GitHub `sistocervantes76-png/Lawnsbytimmy_website`, branch `main` | Public website repo, Cloudflare Worker + static assets | HEAD commit `d6482556807a165aa38793dbfe93085c272e65cf`, Thursday Nov 5, 2026, 7:49 AM ET, "Add a Substack signup section above the homepage footer. (#13)". `index.html` blob sha `fceb4ff483c79f248bf2863cf67bf6aedc4068c4`, size 28,181 bytes — matches the live homepage size and the live form fields and payload keys. |
| Local box clone `/workspace/lbt` | Stale checkout | At `680a6cb` (Tue Nov 3, 2026). `index.html` is 27,013 bytes (no Substack section). **Not used as source of truth.** |
| 6246200 backup, Tue Nov 10, 2026, 7:51 PM ET | LBT_Quote modules + scenario | Sidecar hashes confirmed below. Used only to read filters, price keys, and field mappings. |
| `/workspace/lawns-offer-page` | Frozen 444-file offer/pay build | Read-only. `index.html` quote step asks name, phone, and address only; other lead fields are hard-coded in the payload. |
| `/workspace/lawns-flow/flow-server.mjs` | TEST ACCEPT / pay-link service | Read-only. Auto pay-link eligibility depends on CRM Lot_Size, Frequency, Zip, and Price_Per_Visit. |

6246200 backup files (wrappers already stripped; sidecar lists both hashes):

- `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_scenario.json` sha256 `c52a3107dc07320616d2e173cd9959934fdab7220a878847d939eed5220f0667`
- `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951_modules.json` sha256 `168a8ca0ead08b1cb97b7f073839fb181ff58a1cf990d218e230aba90d272008`
- sidecar `/workspace/backups/make/6246200_before_two_question_sms_20261110_1951.sha256`

Live 6246200 name LBT_Quote, status active, lastEdit Sunday Nov 8, 2026, 6:04:55 PM ET (unchanged in this work).

---

## 2. Current website quote form fields

The public form is the only lead form on lawnsbytimmy.com. It is built in `index.html` (not in the Worker). The Worker (`src/worker.js`) only handles `/api/account/*` sign-in; everything else is the static site.

Submit button: **Get My Instant Quote**. Success copy: "Thank you! Check your email. Your price is on its way, usually within a minute."

Hero and section copy still sell instant pricing: "Instant Quoting — Pick your yard size and get your per-visit price by email in about a minute"; "Get My Instant Quote"; "Tell us about your property and we'll email you your price in about a minute." How It Works step 1 is "Get Your Instant Price" (address and property details). Step 2 already places gate clearance after the quote: "Review your quote, verify gate clearance, and link your card on file."

The site's listed services are mowing, edging, line trimming, and blow-off. There is no tree-work or irrigation service on the page (same fact Proof used on the missed-call wording).

### Fields the visitor sees

| Label | HTML name | Required? | Values / notes |
|---|---|---|---|
| First Name | `first_name` | Yes | text |
| Last Name | `last_name` | Yes | text |
| Cell Phone | `phone` | Yes | tel |
| Email | `email` | Yes | email |
| SMS consent checkbox (long 10DLC / STOP language, links to Privacy and Terms) | `sms_consent` | No | checkbox; posted as boolean `true` only if checked |
| Service Address | `service_address` | Yes | text |
| City | `city` | Yes | Oakland Park, Fort Lauderdale, Wilton Manors |
| Zip Code | `zip` | Yes | 5 digits |
| Gate Clearance Width | `gate_width` | Yes | Radio: "Gate is 36\" wide or wider…" posts `48`; "Standard walk gate (under 36\" wide)" posts `30`. Hint: narrower gates may need push-mower labor. |
| "I confirm pets will be secured indoors during our scheduled service window." | `pets_secured` | Yes (must check to submit) | checkbox; this is a confirmation, not a yes/no "any pets?" question |
| Service Frequency | `frequency` | Yes | Radio: `Bi-Weekly` ("Bi-Weekly Mowing (every 2 weeks)") or `Monthly` ("Monthly Mowing") |
| Lawn size (grass area only) | `lot_size` | Yes | `Small (under 5000 sqft)`; `Medium (5000-10000)`; `Large (10000-20000)`; `XL (20000+)`; `Not sure` |
| Add-On Requests (optional) | `add_ons` | No | Core Aeration ($150); Shrub & Bed Maintenance; Seasonal Property Cleanup |
| "I agree to securely link a card on file…" | `card_on_file_agreed` | Yes (must check) | checkbox |
| Last cut / when was it last cut | — | — | **Not on the form** |
| What service they need (mowing vs something else) | — | — | **Not on the form.** The form assumes mowing. Add-ons are extras, not a service-type question. This is no longer the missed-call follow-suit question. |
| Preferred day / which day works best (Tue-Sat) | — | — | **Not on the form.** This is the follow-suit question to add. The CRM already has a Service_Day column (see below). |

### Where it posts

The form JavaScript builds `{ event: "lead_form_submitted", timestamp, lead_data: { … } }` and POSTs JSON to the Make custom webhook that triggers **LBT_Quote (6246200)**. The URL is hardcoded as `LEAD_WEBHOOK_URL` in `index.html`. **Do not publish that URL.** Playbook earlier confirmed that hook belongs to 6246200.

`lead_data` keys posted today:

`first_name`, `last_name`, `phone`, `sms_consent` (boolean), `email`, `lot_size`, `service_address`, `city`, `zip`, `gate_width_inches` (number 48 or 30, or null), `pets_secured` (boolean), `frequency`, `add_ons` (array), `card_on_file_agreed` (boolean).

---

## 3. What 6246200 does with those fields

Order in the Nov 10 backup: webhook (module 1) → set variables 5 and 6 → Customers addRow (module 2, filtered) → webhook respond (module 11, body "Thank you! Check your email") → owner email (module 4) → router 8 with four customer routes, each with a send-failure owner email.

### Module 2 filter (CRM row is written only if this passes)

Filter name: **Real lead (has email or phone)**. OR of: `lead_data.email` contains `@`, or the digits-only phone length is ≥ 10. Gate, pets, frequency, lot size, and last cut are **not** in this filter. Dropping them does not block the CRM row.

### Module 5–6 price key (this is what breaks auto-price)

Module 5 `key` = first word of `lot_size` (trimmed, lowercased) + `frequency` (trimmed, lowercased, hyphens and spaces stripped). Examples: `Small (under 5000 sqft)` + `Bi-Weekly` → `smallbiweekly`; `Monthly` → `smallmonthly`.

Module 6 `base` is a switch on that key:

| key | base |
|---|---|
| `smallbiweekly` | 45 |
| `smallmonthly` | 50, or 60 in May–September |
| `mediumbiweekly` | 50 |
| `mediummonthly` | 63, or 75 in May–September |
| `largebiweekly` | 58 |
| `largemonthly` | 73, or 87 in May–September |
| `xlbiweekly` / `extrabiweekly` | 70 |
| `xlmonthly` / `extramonthly` | 88, or 105 in May–September |
| **anything else, including a missing frequency, a missing lot size, or "Not sure"** | **0** |

"Not sure" already yields `not` + frequency (for example `notbiweekly`) → `base` = 0. That path already exists on the live form.

Zone comes only from the 5-digit ZIP: zone 1 (33309, 33311, 33312, 33315, 33334), zone 2 (33301, 33304, 33305, 33306, 33308, 33313, 33316, trip fee $10), else zone 3. Address and service type are not used in the price formula.

**Gate width, pets, last cut, and add-ons are not inputs to `base`, zone, or trip.** Last cut is not in 6246200 at all.

### Router filters (customer email / SMS)

A priced quote is sent only when **zone is not 3 and `base` > 0**:

- Module 3 (priced email): zone ≠ 3 AND base > 0 AND email contains `@`. Copy includes `${base+trip} per visit` for `{frequency} mowing ({lot_size})`.
- Module 9 (priced SMS, RingCentral): `sms_consent` is true AND phone exists AND zone ≠ 3 AND base > 0. Copy includes the same dollar amount and frequency. Wording lives in this Make module, not in a RingCentral template.

The no-price / "we'll confirm" path already runs when **zone = 3 or `base` = 0**:

- Module 7 (confirm email): (zone = 3 AND email has `@`) OR (base = 0 AND email has `@`). Copy: "You're just outside our regular route, so we'll confirm your price within 1 business day." (This sentence is also used when the yard is in-zone but size/frequency did not price, including "Not sure".)
- Module 10 (confirm SMS): (`sms_consent` true AND phone exists AND zone = 3) OR (`sms_consent` true AND phone exists AND base = 0). Copy: "We got your request and will confirm your price within 1 business day. Want it faster? Reply with 2-3 photos of your yard."

If lot size and/or frequency are dropped or blank, `base` becomes 0. In-zone leads then **do not get an automatic dollar amount**. They get the confirm email (if they entered an email) and/or the confirm text (if they consented to SMS). They do **not** receive a "$0" price text or email — those priced modules are filtered off. The form success message would still falsely promise a price within a minute unless the website copy also changes.

### What gets written to the Customers row (module 2)

Lead_Source is `Website Form`. Status is `New Lead`. Customer_ID is `LC-` plus a New York timestamp.

Mapped from the form: First_Name, Last_Name, Phone, Email, Service_Address, City, Zip, Lot_Size, Frequency, SMS_Consent (Yes/No), Access_Notes as `Gate: {gate_width_inches} in`.

Price_Per_Visit and Monthly_Total are filled only when zone ≠ 3 and base > 0; otherwise they are left blank (not $0). Monthly_Total multiplies the per-visit price by 4.33 (weekly), 2.17 (biweekly), or 1 (monthly).

**Not mapped today (existing gaps, still true if the form stays as-is):**

- Services (column 12) — `add_ons` is posted but never written to the sheet or mentioned in the owner email.
- Service_Day (column 20, 0-based `mapper.values.20`) — existing Customers header; 6246200 module 2 does not write it. This is the right column for a new preferred-day answer (Tue, Wed, Thu, Fri, Sat). Do not use Services (col 12) or Notes (col 23) for it unless Service_Day is later ruled out.
- Notes — no form notes field.
- Pets — only appear on the owner email (`pets_secured`), not on the row.
- Card_On_File — `card_on_file_agreed` is only on the owner email.
- Last cut — not collected.

If gate is omitted and the Access_Notes mapping is left as-is, the row would get the broken string `Gate:  in`.

Owner email (module 4) always lists lot size, frequency, gate width, pets secured, card-on-file agreement, zone, and "Price quoted: ${base+trip} per visit". If `base` is 0, that line would say **$0** (plus any trip fee) even though the customer was not quoted $0. That is a real problem for option A unless the owner email is changed.

---

## 4. Offer page and flow-server (the after-accept "payload" app)

The public website form above is live. The **after-accept app** is a different, still-TEST system:

- Frozen offer page `/workspace/lawns-offer-page` (do not edit). The visitor-facing quote step asks only **Full name, Mobile phone, Service address (include ZIP)**. The playbook calls the JSON this page builds **Payload**. It posts the same `lead_data` shape as the public form, but hard-codes `email: ""`, `lot_size: "Not sure"`, `gate_width_inches: null`, `pets_secured: false`, `frequency: "Bi-Weekly"`, `add_ons: []`, `sms_consent: true`, `card_on_file_agreed: true`. In test, `USE_REAL_WEBHOOK` is false, so leads go to `/mock/lead` and never to Make. The page is not what lawnsbytimmy.com serves today.
- `flow-server.mjs` (`/workspace/lawns-flow` and the copy under the frozen offer-page proof tree): TEST only. `TEST_MODE = true` (texts are logged, never sent). Stripe test keys only. It reads TEST Customers / Jobs tabs. `POST /api/accept` looks up the newest open CRM row for that phone (Status New Lead, Quoted, or Quote Accepted).
- Auto pay-link is sent only if **all** of these hold: Lot_Size starts with `small`; Frequency normalizes to `biweekly`; ZIP is zone 1 or 2; CRM Price_Per_Visit matches the Stripe test visit price for that zone. Otherwise it marks the row Quote Accepted, alerts Timmy ("send price by hand; no automatic pay link"), and sends no link. Gate, pets, and last cut are not used in that eligibility check.
- Live 6691639 still has no outbound SMS and no ACCEPT pay-link route. TEST scenario 6918616 remains OFF. Booking-playbook go-live items 2–11 still need Sisto's yes. Item 6 is the live ACCEPT patch; item 2 is porting this service into a Cloudflare Worker.

**Answer to "is it still at payload": yes.** The app that would connect a customer after they accept a quote is still at that TEST payload / offer-page / flow-server stage. It is not live. Accepting a quote today only emails the owner.

Because auto pay-link also needs lot size (small) and bi-weekly frequency already on the CRM row, option A (not collecting those on the form) would leave website leads ineligible for an automatic pay link even after ACCEPT is turned on, until Timmy fills Lot_Size, Frequency, and Price_Per_Visit by hand — or the offer is redesigned to assume a frequency.

---

## 5. What would break if the form drops frequency / gate / pets / last cut

Last cut: nothing in 6246200 or the public form depends on it. No break.

Gate and pets: price, zone, router filters, and flow-server eligibility do not use them. Only Access_Notes (`Gate: … in`) and the owner-email lines would be wrong or empty. Safe to move after ACCEPT if those two mappings are cleaned up.

Frequency and lot size: **required for an automatic price.** If either is missing or not a known pair, `base` = 0, so:

- In-zone customers get the "we'll confirm your price within 1 business day" email/SMS instead of a dollar amount. There is no automatic "$45 per visit" email or text.
- Customers Price_Per_Visit and Monthly_Total stay blank.
- Owner email still says "Price quoted: $0 per visit" unless that template is changed.
- Homepage "Instant Quote / price in about a minute" copy would be false.
- Later, flow-server will not issue an automatic ACCEPT pay-link for those rows.

Dropping only gate/pets/last cut, and keeping lot size + frequency, does **not** take the auto-price path down.

---

## 6. Two options

Website leads are not missed-call leads. The form still has to collect name, phone, email, address, city, and ZIP, because 6246200 emails and texts from those fields and the missed-call path already has the phone. "Follow suit" here means: do not ask gate, pets, frequency, or last cut up front unless they are needed to price; ask address and preferred day (Tue-Sat) up front, and ask the rest after they accept.

### Option A — Contact + address + preferred day only; no auto price

**Form fields (proposed labels):**

- First Name, Last Name, Cell Phone, Email (all required, same as today)
- SMS consent checkbox (optional, same language)
- Service Address, City, Zip Code (required, same as today)
- **When / which day works best?** (required). Preferred-day choice with exactly these values: **Tue, Wed, Thu, Fri, Sat** (Tue-Sat, matching the live missed-call text). Do not offer Mon or Sun unless he later expands the window. Keep **Add-On Requests (optional)** if he still wants aeration / shrub / cleanup collected up front, or move those after accept too. A service-type field is not required for follow-suit.
- Card-on-file agreement: keep, or move to after accept. Recommendation if A is chosen: move it with the other after-accept questions, because there is no instant bookable price on this path.
- **Drop:** Gate Clearance Width, pets confirmation, Service Frequency, Lawn size.

**What 6246200 would do with fewer fields, if left unchanged:** every such lead gets `base` = 0 and falls onto the existing confirm path (modules 7 and 10), not a dollar quote. That is close to "we'll text you a quote," but the current wording is "we'll confirm your price within 1 business day," the on-site success message still promises a price in about a minute, and the owner email would show "$0 per visit."

**6246200 changes required for option A** (do not apply now):

1. Re-backup 6246200 immediately before any later patch.
2. Module 4 owner email: stop saying "Price quoted: $0." Say that no automatic price was sent and Timmy needs to quote them. Drop or reword the gate / pets lines.
3. Modules 7 and 10 (and their failure emails): change customer wording to the promise he wants, for example that we will text them a quote, not that they are "just outside our regular route" (that sentence is wrong for in-zone leads with no size/frequency).
4. Module 2: stop writing `Gate:  in`; leave Access_Notes blank until after ACCEPT. Leave Lot_Size, Frequency, and prices blank. **Required:** map the new preferred-day field into Service_Day (column 20) and into the owner email, so the answer is not collected and dropped. Consider putting add-ons in Services (column 12) or Notes (they are collected today and then dropped).
5. Modules 3 and 9 stay filtered on base > 0, so they should not fire. Do not add a silent default frequency (for example Bi-Weekly) just to keep auto-price; that would quote a frequency the customer has not chosen.
6. Website copy in `index.html`: replace Instant Quote / "price in about a minute" / "Get My Instant Quote" / the form success message, so the page does not promise an automatic price.

After ACCEPT (still go-live item 6, not live): ask gate, pets, bi-weekly or monthly, and last cut. Pricing would happen by hand (or by a later 6246200 redesign) **before** they are asked to accept, or the offer would have to assume a frequency — the same conflict already flagged on the missed-call plan.

### Option B — Keep lot size + frequency so auto-price still works; move gate / pets / last cut

**Form fields (proposed labels, recommended):**

Keep, exact labels as live unless noted:

- First Name, Last Name, Cell Phone, Email
- SMS consent (same checkbox language)
- Service Address, City, Zip Code
- **Which day works best (Tue-Sat)?** — new, required. Choice values: **Tue, Wed, Thu, Fri, Sat**. Do not include Mon or Sun unless he later expands the window. Keep Add-On Requests (optional) with the current three labels. A "What service do you need?" field is not required for follow-suit (the form still assumes mowing).
- Service Frequency: Bi-Weekly Mowing (every 2 weeks) / Monthly Mowing (required, current values `Bi-Weekly` / `Monthly`)
- Lawn size (grass area only): current five options, including Not sure (Not sure already goes to the confirm path)
- Card-on-file agreement (current required checkbox)
- Button: Get My Instant Quote
- Success message can stay, because a priced email still goes out when size+frequency+ZIP price.

**Drop from the form:**

- Gate Clearance Width (entire fieldset)
- Pets secured checkbox

Last cut stays off the form, as it is today.

**What 6246200 does:** auto-price keeps working for known size+frequency keys in zones 1–2, including summer monthly amounts and the $10 zone-2 trip. "Not sure" and zone 3 still use the confirm path. No change to modules 5, 6, 3, 7, 9, or 10, and no change to router filters.

**Small 6246200 cleanups to do with the form change (do not apply now):**

1. Re-backup first.
2. Module 2 Access_Notes: do not write `Gate:  in` when gate is absent; leave the cell blank.
3. **Required:** Module 2 must map the new preferred-day field into Service_Day (column 20). Module 4 owner email must include that preferred day. If this mapping is skipped, the answer is collected on the form and then dropped, the same way add-ons are today.
4. Module 4 owner email: remove or reword Gate width and Pets secured, and say those will be asked after they accept. Optionally include add-ons (add-ons are already posted and ignored).
5. Payload: omit `gate_width_inches` and `pets_secured` (do not send `pets_secured: false`, which would read as "pets not secured" if the email is left unchanged). Post the preferred-day value in `lead_data` (recommended key: `service_day` or `preferred_day`) so module 2 can map it.

**After ACCEPT (still item 6):** send the four-question text only where needed. For website leads that already have Frequency on the row, ask gate, pets, and last cut, and **do not re-ask bi-weekly or monthly**. Do not re-ask preferred day if Service_Day is already filled. Skip the whole questions text when gate and frequency are already filled (today's form leads); once this form drops gate, website leads will need the shorter three-question follow-up. Missed-call leads with blank gate/frequency still get all four; they will already have been asked preferred day on the first text, so that follow-up should not re-ask the day if they answered.

Homepage instant-quote copy can stay. How It Works step 2 already says gate clearance is verified after the quote.

---

## 7. Recommendation

**Recommend option B**, plus the new preferred-day choice (Tue, Wed, Thu, Fri, Sat) mapped into Service_Day (column 20) and the owner email.

Reasons:

1. The live site's main promise is instant quoting. Option A turns that off for every website lead unless 6246200 is redesigned, and it makes the current hero and success copy false.
2. Frequency (and lot size) are required for module 6's automatic price. That is the same conflict Proof already confirmed on the missed-call plan. The website can still collect them up front without asking gate, pets, or last cut.
3. Gate, pets, and last cut do not affect price. Last cut is not asked today. Moving those three after ACCEPT is the part of "follow suit" that does not break the quote.
4. Missed-call texts skip name/email/lot size because the caller already provided a phone and is not being auto-priced by 6246200. Website leads are. Contact fields and the pricing pair are not extra trivia; they are what 6246200 and a later ACCEPT pay-link use.
5. flow-server will only auto-send a pay link for small + bi-weekly rows with a matching Price_Per_Visit. Option A would make almost every website lead a hand-priced ACCEPT. Option B keeps that path available for the common small bi-weekly case.
6. Preferred day (Tue-Sat) is the missed-call question the form does not ask today. Adding that choice under B follows suit. A service-type field is no longer required for follow-suit.

Option A is the stricter reading of "only address and preferred day up front," and it is the right choice only if he is willing to drop instant website pricing and quote those leads by hand (or assume a frequency). That has to be his call, not a default.

---

## 8. Change list (not authorized to apply)

0. Already done: this read-only inspect and draft. No Make write, no repo write, no PR, no deploy.
1. Proof checks this plan against the live homepage, GitHub `main` at `d648255`, and the Nov 10 6246200 backup (request: `/workspace/proof-notes/lawns-website-two-question-check-request-2026-11-10.md`). No patch on FAIL, and no patch on PASS until Sisto picks A or B and says to apply it.
2. **Sisto's single decision:** option A or option B. (If B, the recommended preferred-day field is part of the draft and must be mapped to Service_Day and the owner email; he can still strike or reword the choices. If A, he also accepts losing instant website prices until a later pricing design. The same Service_Day + owner-email mapping is required under A.)
3. Only after Proof PASS and his yes: open a **draft** PR on `sistocervantes76-png/Lawnsbytimmy_website` for the form and copy changes in `index.html` (and any success / hero / How It Works wording that would otherwise be false). Do not merge. Do not deploy. Do not put webhook URLs in the PR description.
4. Re-backup 6246200, then apply only the Make field/copy changes listed under the option he picked. Proof reads the live modules back. Touch no prices, no zone lists, and no connections.
5. After-ACCEPT questions stay with go-live item 6 (TEST first). Do not treat this website plan as ACCEPT go-live. Update the skip rule so form leads are not asked frequency again under option B.
6. Teaching / playbook notes: update only after the live form actually changes. The frozen offer-page payload is a separate later change if that page is ever deployed; do not edit it in this work.
7. Out of scope unless he later says otherwise: live Stripe, RingCentral campaign / templates (website SMS wording already lives in 6246200, not in RingCentral), 6671272, merging or deploying the website PR, turning TEST 6918616 on, sending customer SMS from this work.

### Live vs later (summary)

| Piece | State now |
|---|---|
| lawnsbytimmy.com form (full fields including gate, pets, frequency, lot size) | Live, posts to 6246200 |
| 6246200 auto-price from lot size + frequency | Live |
| Last-cut question on the website | Not present |
| "What service do you need?" on the website | Not present (mowing is assumed); no longer the follow-suit add |
| Preferred day (Tue-Sat) on the website | Not present; CRM Service_Day column exists but is unmapped in 6246200 |
| add_ons written into the CRM | Not mapped (existing gap) |
| After-ACCEPT questions SMS | Not built, ACCEPT not live |
| Offer-page payload / flow-server pay link | TEST only, not deployed |
| Playbook go-live items 2–11 | Not done |

---

## 9. What this is not

- Not a website PR, merge, or deploy.
- Not a 6246200 change.
- Not permission to send texts or turn on ACCEPT.
- Not a Proof PASS (request is separate).
- Not a change to RingCentral itself. Quote SMS text is in Make 6246200 modules 9 and 10.

## Proof FIX applied (Tue Nov 10, 2026, ~8:13 PM ET)
Option B required cleanups originally included: map a new "What service do you need?" field into the Customers row (Services, col 12) and into the owner email in 6246200, so the answer is not collected and dropped. Pre-filling "Mowing" vs leaving it blank was Sisto's call. That service-field mapping is superseded by the 8:20 PM ET revision below; the same "do not collect and drop" rule now applies to preferred day.
Correction: lawnsbytimmy.com/account (My Account, Make LBT_Customer_Account 6618999, CRM Account Requests tab) lets existing customers (LC- ID + matching phone, texted code) send gate/pet/access notes and other requests. Missed-call leads can't sign in; before becoming customers they answer by text.

## Revision after missed-call Applied v2 (Tue Nov 10, 2026, 8:20 PM ET)

Live 6671272 first text is now address + preferred day (Tue-Sat), not address + what service they need. Follow-suit on the website was revised to match, before any A/B choice is taken to Sisto. Nothing on the website or in 6246200 was changed.

Under **option B** (still recommended): the new field is a preferred-day choice with values **Tue, Wed, Thu, Fri, Sat**. It must be mapped into the Customers row at **Service_Day (column 20)** — an existing header that 6246200 module 2 does not currently write — and into the module 4 owner email. Using Services (col 12) would mix a weekday into the services column; Notes (col 23) would work only as a fallback if Service_Day were later ruled out.

Under **option A** (contact + address + preferred day only): the same preferred-day field and the same Service_Day + owner-email mapping are required. Lot size and frequency are still dropped, so auto-price still turns off.

A "What service do you need?" field is no longer required for follow-suit on either option.
