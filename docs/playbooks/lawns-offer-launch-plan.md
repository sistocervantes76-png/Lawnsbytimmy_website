# Lawns by Timmy — Offer Page Launch Plan

**Status:** Awaits **Proof's check**, then **Sisto's OK**. Nothing in this file has been posted, texted, emailed, or deployed.

**Owner:** Lawns (launch plan). Fox owns videos / filming list separately.  
**Written:** Nov 5, 2026, ~12:55 PM America/New_York.  
**Proof edits applied:** Nov 5, 2026, ~12:57 PM America/New_York.  
**Sources used:** `/workspace/lawns-offer-page/` (index.html, server.mjs, worker.js, stripe-test-ids.json, README), `/workspace/playbooks/lawns-booking-payment-playbook.md`, `/workspace/playbooks/lbt-quote-45-change.md`, Make LBT_Quote (6246200) module 6 read-only Nov 5 ~12:57 PM ET, known operating state from Lawns notes. Design file `Living Landscapes Booking.dc.html` was **not** used for names, prices, ZIPs, branding, or address.

**Offer (Sisto, Nov 5, 2026) — matches test page + playbook:**
- Small yards (up to 5,000 sq ft), bi-weekly, **from $45 / visit**; your quote confirms the price for your address. Zone 1 Make price **$45**; Zone 2 Make price **$55** (base $45 + $10 trip). **Zone 2 pricing is pending with Sisto** for customer-facing copy.
- **4-visit package $154** up front (first visit **$19**, then 3 at **$45**). Recurring bi-weekly only; visits can't be split or used as one-time cuts.
- Catch-up still applies to lawns not cut in over 10 days; amount is **quoted separately** (no dollar figure in sources) → **[CHECK: catch-up $ amount from Sisto]**.
- Cancel early → unused visits become **account credit**, **no cash refund**.
- After visit 4: **renew the 4-visit package for $139**, plus rewards and a seasonal promo → **[CHECK: details from Sisto]** (do not invent).
- Book and pay on phone; **card can be saved (optional)** (`setup_future_usage=off_session` in test when they choose to save).

**Internal note (Nov 5, ~1:41 PM ET):** Offer page headline changed to lead with **"Your first cut is $19"** + package subline ($154 up front). Drafts below were not rewritten for that; update channel copy in a later pass if needed.

**Business facts used in drafts:** lawnsbytimmy.com · info@lawnsbytimmy.com · text/call **(954) 880-3500** (+1 954-880-3500) · service area **Oakland Park & Fort Lauderdale** (booking page names Broward: "In person at your property (Broward County, FL)") · Timmy / signs mail as Sisto Cervantes · in lawn work since 2002 (24 years); running Lawns by Timmy for 15 · free estimate calendar https://calendar.app.google/cEtwcki68DJwSfv89 · TikTok https://www.tiktok.com/@sistocervantes (profile only; no post made).

---

## 1. Before-launch setup checklist

Mark legend: **exists** | **needs building** | **needs Sisto**

### Offer / payments / site

| # | Item | Status | One-line reason |
|---|---|---|---|
| 1 | Offer page (phone flow: offer → 3 fields → pay → paid → My Account) | **exists** (test only) | Built at `/workspace/lawns-offer-page`; Stripe test payments $45 and $154 succeeded Nov 5; `LBT_TEST_BUILD = true`, `USE_REAL_WEBHOOK: false`. Book-and-pay links in drafts are **BLOCKED** until this is live. |
| 2 | On-page booking confirmation ("You're booked" / "Payment received. Your booking is confirmed.") | **exists** | Paid screen in `index.html`; no separate SMS/email confirmation for a completed offer-page payment. |
| 3 | SMS and/or email booking confirmation after pay | **needs building** | Make has quote / job-done texts, not an offer-page "you paid / you're booked" confirmation for this flow. First-visit scheduling text is a **manual Sisto step** (see drafts 4f/4g). |
| 4 | `?src=` (or equivalent) channel tags on the offer URL | **needs building** | Page only reads `?mock=1`; lead payload hard-codes `source: "offer-page"`. No gbp/nextdoor/facebook/tiktok/instagram/text/email/flyer param handling. |
| 5 | Site banner / homepage CTA pointing at the offer | **needs building** | Offer page is not on the live Worker site yet; website changes are PR-only. Live site also conflicts with this offer (hero "Every Week"; FAQ says pay after each visit) → see conflicts. |
| 6 | Live Stripe products/prices ($45, $154) + live keys in Worker | **needs Sisto** | Test prices exist; `worker.js` / `server.mjs` refuse `sk_live_` by design; playbook go-live needs Sisto OK. |
| 7 | Deploy offer page + set `USE_REAL_WEBHOOK: true` | **needs Sisto** | Playbook §9; nothing live without his OK. Also needs Proof check. |
| 8 | LBT_Quote small bi-weekly Make price | **exists** (confirmed) | Read-only `scenario_module_get` on 6246200 module 6 at ~12:57 PM ET Nov 5: `smallbiweekly` base **45**; Zone 2 trip **+10** → **$55**. Matches Alexander's 12:55 PM ET report. Zone 2 customer-facing pricing still **pending with Sisto**. |
| 9 | ACCEPT → payment-link route in Text Replies | **needs building** | Decided rule, not built (playbook §2). Do not promise ACCEPT in launch copy until built, or build first. |
| 10 | Resolve live-site copy conflicts (weekly vs bi-weekly; pay-after-visit vs prepaid package) | **needs Sisto** | Playbook §4b. |
| 11 | Final offer URL path on lawnsbytimmy.com | **needs Sisto** | **[CHECK: exact live path]** e.g. `/` vs `/offer` vs dedicated Worker host. Drafts below use `https://lawnsbytimmy.com/?src=…` as placeholder until he picks the path. |
| 12 | Site indexing / Search Console | **needs Sisto** | Known state: site isn't indexed yet. |
| 13 | Catch-up fee dollar amount for customer-facing copy | **needs Sisto** | Page + playbook: "quoted separately" / over 10 days; no $. |
| 14 | Renewal / rewards / seasonal promo details | **needs Sisto** | Page shows "$139", "rewards", "seasonal promotion" with no rules → **[CHECK: details from Sisto]**. |
| 14b | Zone 2 pricing for customer-facing copy | **needs Sisto** | Make charges Zone 2 small bi-weekly at $55; offer page shows a flat **$45 / visit, bi-weekly** (not "from $45"). Pending his wording. |

### Channels & trust

| # | Item | Status | One-line reason |
|---|---|---|---|
| 15 | Google Business Profile status (finish profile + post) | **needs Sisto** | GBP unfinished; no reviews yet. He must confirm status, then post / approve. |
| 16 | Google review link for post-visit asks | **needs Sisto** | No review URL in offer page, playbook, or Lawns notes → draft **4m BLOCKED** until a real link exists. |
| 17 | Nextdoor status (sign-in + intro post) | **needs Sisto** | Nextdoor not signed in yet in Lawns browser; never post without his explicit yes. |
| 18 | CRM text consent for 4d / 4e recipients | **needs Sisto** | Only people with SMS/email consent; he confirms consent is current before any blast. |
| 18b | Who gets drafts 4d / 4e (existing CRM thank-you) | **needs Sisto** | He picks the recipient list; draft only; send nothing. |
| 19 | RingCentral 10DLC status (marketing + payment/booking texts) | **needs Sisto** | Registration unconfirmed; sample messages should show full lawnsbytimmy.com links. |
| 20 | Facebook / Instagram / TikTok posts | **needs Sisto** | Drafts only; Fox owns video/filming. TikTok handle known; no auto-post. |
| 21 | Flyer / yard-sign / door-hanger with `?src=flyer` | **needs Sisto** | No print asset in these sources. |
| 22 | Fox videos + filming list | **exists** (owned elsewhere) | Fox handles separately; launch uses stills/copy until video is ready. |

### Recommended `?src=` tags (build into page + CRM Lead_Source)

Use full links, no shorteners. Until tracking is built, tags are planned only. **Book-and-pay links stay BLOCKED until the offer page is live.**

| Channel | Example link (path **[CHECK]**) |
|---|---|
| Google Business | `https://lawnsbytimmy.com/?src=gbp` |
| Nextdoor | `https://lawnsbytimmy.com/?src=nextdoor` |
| Facebook | `https://lawnsbytimmy.com/?src=facebook` |
| TikTok | `https://lawnsbytimmy.com/?src=tiktok` |
| Instagram | `https://lawnsbytimmy.com/?src=instagram` |
| Customer text | `https://lawnsbytimmy.com/?src=text` |
| Email | `https://lawnsbytimmy.com/?src=email` |
| Flyer / print | `https://lawnsbytimmy.com/?src=flyer` |

---

## 2. Launch-day sequence (simple)

Do nothing live until Proof clears this plan and Sisto says yes.

1. **Sisto confirms** catch-up $, renewal/rewards/promo wording, Zone 2 customer copy, final offer URL, 10DLC status, GBP/Nextdoor status, CRM consent + who gets 4d/4e, and that live Stripe may go live.
2. **Proof re-checks** page + playbook + this plan against live config.
3. **Go-live tech (with Sisto OK):** create live Stripe prices; Worker secrets; lift `sk_live_` guard deliberately; deploy offer page; `USE_REAL_WEBHOOK: true`; one real phone test with a card he controls. (Make small bi-weekly already $45 / Zone 2 $55 as of Nov 5 ~12:55–12:57 PM ET.)
4. **Turn on `?src=`** (or ship without it and log channel manually — prefer ship with tags). Unblock book-and-pay links in posts only after the page is live.
5. **Site banner / homepage CTA** goes up via approved PR + deploy (same OK).
6. **Google Business:** finish profile basics if still open, then publish the GBP post (draft §4).
7. **Nextdoor intro** only after sign-in and his yes (draft §4).
8. **CRM thank-you / intro text or email** only to people he picks, after consent + 10DLC check (draft §4). Marketing texts include STOP language.
9. **Social:** Facebook / Instagram / TikTok posts when he says yes; attach Fox video when ready.
10. **Watch first leads** in CRM (Status Lead / paid) and Make; reply personally if something looks off — still no auto-posting. **Sisto manually texts** when each first visit is set (nothing automated does this yet).

---

## 3. Week-after follow-ups

All **DRAFT, NOT SENT**. No referral reward invented.

| When | What | Notes |
|---|---|---|
| Day of first paid booking | Short thank-you text from Timmy | Use after first real customers; personal, not a blast. Include STOP. |
| After visit 1 (same day or next morning) | Review ask | **BLOCKED** until a real Google review link exists. Job Done Text + Feedback already collects 1–5 ratings; review ask is separate. |
| ~3–7 days after visit 1 (or after visit 2) | Referral nudge | No reward promised. **[CHECK: whether he wants a referral reward at all.]** |
| End of week 1 | Quick note to Sisto (via Alexander/Proof path) | Count of paid offers, sources if `?src=` works, any catch-up quotes needed. |

Existing Make: **Job Done Text + Feedback** (ratings 1–5) stays as-is; don't break it.

---

## 4. Drafts — every post and message

Each block is headed **DRAFT, NOT SENT**. Voice: plain, friendly, local; in lawn work since 2002 (24 years); running Lawns by Timmy for 15. Texts: short, full lawnsbytimmy.com links, no shorteners; marketing texts include "Reply STOP to opt out." Emails signed **Sisto Cervantes, Lawns by Timmy**.

Replace `https://lawnsbytimmy.com/?src=…` with the final path when Sisto picks it. Do not invent promo or referral rewards. **Any "book and pay on your phone" link is BLOCKED until the offer page is live.**

---

### 4a. Google Business Profile post

**DRAFT, NOT SENT**

Small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address. Oakland Park & Fort Lauderdale.

Or lock in 4 visits for $154 (first visit $19, then three at $45). Recurring bi-weekly only.

**BLOCKED until page is live —** Book and pay on your phone: https://lawnsbytimmy.com/?src=gbp

Lawns not cut in over 10 days need a one-time catch-up first — I'll quote that separately.

Questions? Call or text (954) 880-3500.

— Timmy, Lawns by Timmy

*(Zone 2 pricing pending with Sisto.)*

---

### 4b. Site banner / homepage blurb (for website PR — not live)

**DRAFT, NOT SENT**

**Headline:** Small yards (up to 5,000 sq ft), from $45 a visit  
**Sub:** Your quote confirms the price for your address. Or 4 visits for $154.  
**Button:** **BLOCKED until page is live —** Get the offer → `https://lawnsbytimmy.com/?src=` **[CHECK: banner src tag, e.g. site]**  
**Fine print (short):** Recurring bi-weekly only. Catch-up quoted separately if the lawn's been sitting over 10 days. Oakland Park & Fort Lauderdale.

*(Zone 2 pricing pending with Sisto.)*

---

### 4c. Nextdoor intro post

**DRAFT, NOT SENT**

Hey neighbors — Timmy here, Lawns by Timmy. I've been in lawn work since 2002 (24 years); running Lawns by Timmy for 15.

For small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address. There's also a 4-visit package for $154 — first visit $19, then three at $45. It's for recurring bi-weekly service only (can't split the visits).

**BLOCKED until page is live —** You can book and pay on your phone here: https://lawnsbytimmy.com/?src=nextdoor

If the grass hasn't been cut in over 10 days, I'll quote a one-time catch-up before we start the regular visits.

Serving Oakland Park & Fort Lauderdale. Call or text (954) 880-3500.

*(Zone 2 pricing pending with Sisto. Book-and-pay link stays unused until the page is live.)*

---

### 4d. Thank-you / intro to existing CRM customers (SMS)

**DRAFT, NOT SENT**  
*(Marketing text — only with SMS consent + 10DLC OK + Sisto's recipient list.)*

Hey [First Name], Timmy here at Lawns by Timmy — thanks for being a customer.

Small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address. Serving Oakland Park & Fort Lauderdale. Or 4 visits for $154. **BLOCKED until page is live —** Details: https://lawnsbytimmy.com/?src=text

Questions? Text me here. Reply STOP to opt out.

*(Zone 2 pricing pending with Sisto.)*

---

### 4e. Same message as email

**DRAFT, NOT SENT**

Subject: Quick update from Lawns by Timmy

Hi [First Name],

Thank you for trusting me with your yard.

I've put a simple offer on the phone for small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address. There's also a 4-visit package for $154 (first visit $19, then three at $45). It's for recurring bi-weekly service — visits aren't split for one-time cuts. You can book and pay on your phone, and you can keep your card on file.

**BLOCKED until page is live —** Here's the page: https://lawnsbytimmy.com/?src=email

If the lawn hasn't been cut in over 10 days, catch-up is quoted separately before regular visits start.

Serving Oakland Park & Fort Lauderdale. Call or text (954) 880-3500 if you want me to look at your place.

Sisto Cervantes  
Lawns by Timmy  
info@lawnsbytimmy.com  
(954) 880-3500

*(Zone 2 pricing pending with Sisto. Book-and-pay link unused until the page is live.)*

---

### 4f. Booking confirmation — SMS (after successful pay)

**DRAFT, NOT SENT**  
*(Transactional follow-up — needs building in Make/Worker; not in the page today beyond on-screen copy.)*

Lawns by Timmy: you're booked. We got your payment for [plan: $45 bi-weekly / 4-visit package $154]. I'll text when your first visit is set. Questions? (954) 880-3500 · **BLOCKED until page is live —** https://lawnsbytimmy.com/?src=text

**MANUAL (Sisto):** "I'll text when your first visit is set" is **not automated** — Sisto sends that follow-up himself when the first visit is scheduled.

---

### 4g. Booking confirmation — email

**DRAFT, NOT SENT**

Subject: You're booked — Lawns by Timmy

Hi [First Name],

You're booked. We received your payment for **[Small-yard bi-weekly $45 / 4-visit package $154]**.

Next step: I'll text when your first visit is set.

Reminders:
- Recurring bi-weekly only. Package visits can't be split.
- If you cancel a package early, unused visits stay as account credit (no cash refund).
- Lawns not cut in over 10 days need a catch-up visit first — quoted separately.

Prefer an in-person look first? Free estimate: https://calendar.app.google/cEtwcki68DJwSfv89

Sisto Cervantes  
Lawns by Timmy  
info@lawnsbytimmy.com  
(954) 880-3500

**MANUAL (Sisto):** "I'll text when your first visit is set" is **not automated** — Sisto sends that follow-up himself when the first visit is scheduled.

---

### 4h. Facebook post

**DRAFT, NOT SENT**

Oakland Park & Fort Lauderdale — small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address.

Or grab 4 visits for $154 (first cut $19, then three at $45). Recurring bi-weekly only. Catch-up for overgrown lawns quoted separately.

**BLOCKED until page is live —** Book and pay on your phone: https://lawnsbytimmy.com/?src=facebook

Call/text (954) 880-3500. — Timmy, Lawns by Timmy

*(Fox video when ready. Zone 2 pricing pending with Sisto. Link unused until the page is live.)*

---

### 4i. Instagram caption

**DRAFT, NOT SENT**

Small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address.  
Or 4 visits for $154 — first visit $19.  
Recurring bi-weekly only. Catch-up for overgrown lawns quoted separately.

**BLOCKED until page is live —** Book on your phone → link in bio / https://lawnsbytimmy.com/?src=instagram

Oakland Park & Fort Lauderdale · (954) 880-3500 · Lawns by Timmy

*(Fox video / stills when ready. Zone 2 pricing pending with Sisto. Link unused until the page is live.)*

---

### 4j. TikTok caption

**DRAFT, NOT SENT**

In lawn work since 2002 (24 years); running Lawns by Timmy for 15.  
Small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address.  
4 visits: $154 (first one $19).  
Recurring bi-weekly only. Catch-up for overgrown lawns quoted separately.

**BLOCKED until page is live —** Book on your phone: https://lawnsbytimmy.com/?src=tiktok

@sistocervantes · (954) 880-3500

*(Fox filming list / video — separate. Zone 2 pricing pending with Sisto. Link unused until the page is live.)*

---

### 4k. Flyer / print blurb

**DRAFT, NOT SENT**

**Lawns by Timmy — Oakland Park & Fort Lauderdale**  
Small yards (up to 5,000 sq ft), from $45 a visit; your quote confirms the price for your address.  
**4 visits $154** (first visit $19, then 3 at $45)  
Recurring bi-weekly only  
**BLOCKED until page is live —** Book & pay on your phone · https://lawnsbytimmy.com/?src=flyer  
Call/text (954) 880-3500  
Catch-up for overgrown lawns quoted separately.

*(Zone 2 pricing pending with Sisto.)*

---

### 4l. Week-after — thank-you to first customers (SMS)

**DRAFT, NOT SENT**

Hey [First Name], Timmy here — thanks for booking with Lawns by Timmy. Glad to have you. If anything looks off after the first cut, text me at this number. (954) 880-3500 Reply STOP to opt out.

---

### 4m. Week-after — review ask after visit 1 (SMS)

**DRAFT, NOT SENT**  
**BLOCKED until there is a real Google review link.**

Hey [First Name], Timmy here — hope the yard looks good after today's visit. If you're happy, a quick Google review helps a lot: **[BLOCKED: need Google review link]**. Thank you. Reply STOP to opt out.

---

### 4n. Week-after — referral nudge (SMS)

**DRAFT, NOT SENT**

Hey [First Name], Timmy at Lawns by Timmy — if a neighbor needs bi-weekly mowing, send them **BLOCKED until page is live —** https://lawnsbytimmy.com/?src=text or have them text (954) 880-3500. Reply STOP to opt out.

---

## 5. Conflicts & open checks (do not paper over)

### Conflicts with the stated offer / this launch

1. **Live website hero** says **"Every Week"**; offer is **bi-weekly** (playbook §4b).
2. **Live website FAQ** says payment is charged **after each visit**; **$154 package is prepaid** (playbook §4b).
3. **LBT_Quote Make** small bi-weekly is now **$45** (Zone 1) and **$55** (Zone 2 = $45 + $10 trip). **Confirmed** read-only via Make `scenario_module_get` on scenario **6246200** module **6** at ~12:57 PM ET Nov 5 (matches Alexander's 12:55 PM ET report). Offer page shows a flat "$45 / visit, bi-weekly" (not "from $45"); Zone 2 customer-facing copy is still pending with Sisto.
4. Offer page sends `lot_size: "Not sure"` → Make often takes the **no-price SMS** path even when the customer already paid on-page (playbook §2). Launch messaging should not assume the old quote SMS is the confirmation.
5. Playbook paid-flow summary once said "We'll **text** your quote"; the page button/copy says **email** your quote. Minor copy drift.
6. Estimate calendar: **30-minute slots starting at 1, 2, 3 and 4 PM ET**, with the last one ending at **4:30**. Days (**Mon–Sat**) are **not confirmed** → **needs Sisto**. Prefer linking the calendar URL only until days are confirmed.
7. Design reference `Living Landscapes Booking.dc.html` has placeholder branding/prices — **ignored** on purpose.

### [CHECK] list (needs Sisto or a real source)

- [ ] Catch-up fee **dollar amount** (sources: "quoted separately" only).
- [ ] Renewal **rewards** and **seasonal promo** details (page mentions them; no rules).
- [ ] **Zone 2** customer-facing pricing wording (Make is $55; pending Sisto).
- [ ] Final **live URL path** for the offer page.
- [ ] **Google review link** (GBP unfinished; no reviews yet) — **4m BLOCKED** until then.
- [ ] **Referral reward** (if any) — drafts promise none.
- [ ] RingCentral **10DLC status**.
- [ ] **Google Business** and **Nextdoor** status.
- [ ] **CRM text consent** and **who gets 4d / 4e**.
- [ ] Estimate calendar **days (Mon–Sat)** — **needs Sisto** (slots confirmed: 30-minute starts at 1, 2, 3 and 4 PM ET; last ends 4:30).
- [ ] Whether to **build ACCEPT → pay link** before launch copy mentions ACCEPT (currently do **not** mention ACCEPT in these drafts).
- [ ] Banner/`?src=` implementation owner and PR timing.

---

## 6. Explicit non-actions

- No posts, comments, emails, or texts sent from this work.
- No website, repo, Make, Stripe, Drive, or CRM writes from this work (Make was **read-only** to confirm prices).
- Fox: videos / filming list — out of scope here; reference only.
- Proof checks this plan before it goes to Sisto.

---

*End of launch plan.*
