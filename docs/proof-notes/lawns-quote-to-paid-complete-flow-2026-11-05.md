# Quote → paid-complete flow check — 2026-11-05 (~2:23–2:40 PM ET)

## Verdict: PASS (test-only isolation) + FIX + NEEDS SISTO before any go-live
Confidence ~85%.

## Sisto gap (Alexander chat 1c614ab4…)
User cu:525478510 exact text:
> theres a gap in the setup from quote to responce back without a stripe payout along with the package deal     theres no connection to pay  going forward into finished job and paind complete

Alexander labeled **1:50 PM ET** and relayed with "paid" (Sisto wrote **paind**) and normalized whitespace. Confirmed.

No Sisto user message found saying ACCEPT auto-sends a pay link, 72h expiry, required card-on-file, auto-charge after Completed, or +14 days next visit. Alexander attributed "Sisto's rule is that ACCEPT sends the Stripe pay-now…" in the Lawns brief — **not Sisto's own words** (earlier today Alexander himself told Sisto that ACCEPT auto-link was something "you never said").

## (a) Test mode Stripe
Account acct_REDACTED, all livemode false.

| PI | amount | status |
|---|---|---|
| pi_REDACTED | 15400 | succeeded |
| pi_REDACTED | 13900 | succeeded |
| pi_REDACTED | 4500 | succeeded |
| pi_REDACTED | 4500 | succeeded |
| pi_REDACTED | 4500 | requires_payment_method (declined) |
| pi_REDACTED | 4500 | succeeded |
| pi_REDACTED | 4500 | succeeded |
| (+ filter/abandoned) pi_REDACTED… $1; pi_REDACTED… unpaid |

Prices: z1 price_REDACTED $45; z2 price_REDACTED $55; pkg price_REDACTED $154; renewal price_REDACTED $139. All livemode false.

**Live** acct_REDACTED: products/prices still only Fork $49/$99 and $7 subscription (old created timestamps). PaymentIntents list empty. Customers list empty. **No new live products/prices/customers/PIs today.**

## (b) No real texts
TEST scenarios 6918627/6918616/6918610/6918620 all **inactive**. No ringcentral modules in TEST quote or ACCEPT clones. Execution inspect of ACCEPT run: webhook → sheets → http flow only. Msg log Would_Send_Via = "SMS (TEST: logged only, not sent)".

Real Customers A2:F80: no 954-555-010x test phones; test rows only on TEST_* tabs. Headers match pre-flow backup (30 cols). **Can't verify** every cell of Jobs/Payments vs backup without a full sheet diff.

## (c) Live Make unchanged vs backups (1:51 PM set)
lastEdit matches backup JSON for 6246200, 6691639, 6618999, 6771610.
6246200 lastEdit = 12:55 PM ET ($40→$45, approved earlier) — **not** edited during the 1:50–2:20 flow build.
6671272: **no backup file** in /workspace/backups/make; lastEdit Oct 25 → likely unchanged; blueprint diff **Can't verify**.
Live 6691639 still has no ACCEPT kind (ACCEPT→reply→email info@). YES→start.

## (d) Terms classification
Sisto-sourced: $154=$19+3×$45; bi-weekly only; no split; catch-up separate / $19 doesn't replace; cancel→credit no refund; renew $139; small ≤5000 sq ft; gap to connect quote→pay→done.

Consistent with live Make: zone 2 trip +$10 → $55 in LBT_Quote module 6 (and TEST quote $55).

Bot design / NEEDS SISTO (money): ACCEPT keyword + auto pay link; 72h link TTL; per-visit card required (no charge today) then off-session charge on Completed; auto +14 day next visit; zone 2 $55 shown to customers; hide package in zone 2; HOLD when Price edited; decline→retry link 7d; renewal link 7d.

## (e) Msg draft issues
- Quote/pay_link drafts OK as DRAFT needing Sisto OK, but they already promise ACCEPT→link, auto-charge after each visit, 3-day link, and zone 2 $55+$10 trip — money wording.
- Renewal $139 factual.
- No catch-up line in most SMS drafts (optional).

## Open risks (#22–32 + this check)
#28 Customer_ID minute collision — applied Sun Nov 8, 2026, 6:04:55 PM ET (live 6246200 now LC-YYMMDD-HHmmss). Same-second collisions can still happen. Existing rows unchanged. Newest-open-row-for-phone matching is a separate point.
#31 offer page PIs lack business=lawns_by_timmy — OPEN.
TEST 6918616: kind switch lists accept before stop; **no STOP route** in the clone — go-live must keep STOP handling.
Offer page amounts $45/$154 match flow catalog; PACKAGE price_id matches; OFFER price_id via env/stripe-test-ids (same z1 id). Flow also has z2+$139 not on offer checkout.

## FIX list
1. Playbook §10 / wrongness #15 / Alexander briefs: stop calling ACCEPT→link "Sisto's rule" until he says it — label bot design / NEEDS SISTO.
2. Go-live step for 6691639: keep STOP route working (prefer STOP before ACCEPT); don't ship TEST clone as-is (no STOP route).
3. Before customer copy goes live: Sisto OK on drafts that promise auto-charge, 72h links, ACCEPT keyword, and zone 2 $55.
4. Add 6671272 blueprint backup (or fetch+diff) so "unchanged" is fully evidenced.
5. #28 Customer_ID uniqueness: seconds added Nov 8, 2026, 6:04:55 PM ET; same-second residual remains before relying on ACCEPT matching.
6. Offer-page webhook metadata (#31) before sharing the same Stripe webhook.

## NEEDS SISTO (with recommendations)
1. Auto-send Stripe pay/save-card link on ACCEPT (vs YES=opt-in only)? Rec: yes for ACCEPT if copy says so; keep YES=start.
2. Auto off-session charge when Job_Status=Completed? Rec: yes for Stripe per-visit customers only; HOLD on price mismatch (already built).
3. Require card on file for per-visit (no charge at accept)? Rec: yes.
4. Zone 2 customer price $55 and hide $154 package? Rec: show $55; decide package separately (Lawns earlier suggested keep $154 everywhere + trip-fee note).
5. Link expiry 72h / renewal+recovery 7d? Rec: OK.
6. Auto-book next visit +14 days? Rec: OK for bi-weekly; first visit date still manual.
7. Approve quote/pay/receipt SMS drafts.
