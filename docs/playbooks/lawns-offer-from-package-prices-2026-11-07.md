# Lawns by Timmy offer, built from Sisto's package prices (Nov 7, 2026)

**Updated:** Sat Nov 7, 2026, ~3:50 PM ET, with Sisto's zone 2 decision (section "Zone 2 trip fee: DECIDED").
**Status:** TEST offer only. Not live, not posted, not sent. No live payment link exists. Proof needs to check this before Alexander brings it to Sisto.
**Written:** Sat Nov 7, 2026, ~3:45 PM ET, by Lawns.

## What Sisto asked
Sisto (to Alexander, Sat Nov 7, ~3:38 PM ET): "use the package prices to create lawns by timmys offer."
I used only prices he has already set (Nov 5). No new prices, rewards, promos, or catch-up amount were added.

## The offer, in plain words
- **Headline:** "Your first cut is $19"
- **Right under it:** "When you start the 4-visit bi-weekly package — $154 up front ($19 first, then 3 at $45)."
- **Or:** $45 a visit, bi-weekly, for a small yard (up to 5,000 sq ft). The card can stay on file for future visits.
- **Terms on the page:**
  - Recurring bi-weekly service only, no one-time cuts. Package visits can't be split.
  - Lawns not cut in over 10 days need a one-time catch-up service first, quoted separately. The $19 first-visit package rate does not replace catch-up.
  - If you cancel the package early, unused visits become account credit, with no cash refunds.
  - Small yard means up to 5,000 sq ft. The final price is confirmed after a quick yard-size check.
  - After 4 visits, you can renew the 4-visit package for $139. The page says "renew", not "10% off".
- **Choosing:** the pay screen opens on the **$154 package** to match the headline. One tap on the checkbox switches it to **$45 / visit**, and the total updates. The page says: "Or uncheck the package below to pay $45 / visit instead."
- **Package card on the pay screen:** "4 visits for $154. First visit just $19, then 3 visits at $45. Save $26 vs $180." ($26 = 4 × $45 − $154. This is plain math, not a new price.)

## Page check (first pass, before the zone 2 decision): nothing in the copy changed
I compared every price and term on the page with Sisto's locked prices. They match:
- Headline $19 tied to the package. The $19 never shows alone as a one-time cut: every place it appears also says "package" or "then 3 at $45".
- $154 package and $45 / visit are both shown, and the customer can choose either one.
- No $40 leftovers. No "10% off" in customer copy. No made-up reward or promo details.
- (Before Nov 7 ~3:43 PM ET, zone 2 was undecided and the page showed a flat $45. It has since been updated to Sisto's decision; see Zone 2 below.)

**One repair (no content change):** the production copy `dist/index.html` was missing from the box. I rebuilt it from the Nov 5 backup (`/workspace/backups/offer-tagging-20261105-1428/dist-index.html`) plus the recorded Proof-checked tagging diff (`proof/flow/dist-index.html.diff`). Its hash matches the Proof-passed hash exactly, and it is set to mode 444 again. The test copy was not touched.

| File | Hash (sha256) | Mode | Changed? |
|---|---|---|---|
| `/workspace/lawns-offer-page/index.html` (test) | c7a3a2e51a7f38fca5f7c5515706861d4d0817691feb1160efd8bc4a5f311707 | 444 | No |
| `/workspace/lawns-offer-page/dist/index.html` (production) | 34aea108dccd4819409ccbf201b0504792536ae36847d6f0a60a4179af604ad1 | 444 | Restored, same bytes as the Proof pass |

**Checker results (Nov 7, ~3:40 PM ET):**
- `--test`: PASS. The test chrome is flagged, which is expected.
- pre-deploy: `BUILD_OK`.
- `--deploy`: FAIL on "publishable key is not pk_live_". This is by design.

The two copies differ only in the test/prod gates: LBT_TEST_BUILD, USE_REAL_WEBHOOK, the mock lead path, the pk placeholder, and the test-card hint.

## Make price check (read-only, Nov 7, ~3:40 PM ET)
LBT_Quote (6246200) module 6 has `smallbiweekly` = **45** and trip = **+10** for ZIPs 33301, 33304, 33305, 33306, 33308, 33313 and 33316. That makes $55 in zone 2. This matches the Nov 5 change Sisto approved and Proof passed. Nothing was written to Make.
Note: the header of `lbt-quote-45-change.md` still says "PREPARED ONLY, NOT APPLIED". That header is out of date. The booking playbook and today's read both show the change was applied.

## Zone 2 trip fee: DECIDED by Sisto (Nov 7, 2026)
His words, via Alexander's card: "Show $55 per visit in those Fort Lauderdale ZIPs, keep the $154 package everywhere, and add that some ZIPs add a $10 trip fee to per-visit service."
(This matches Lawns' earlier recommendation A. It is now his decision.)

Applied in TEST, Nov 7 ~3:45 PM ET:
- **Every zone:** the $154 package ($19 first + 3 at $45) is offered. It is never hidden.
- **Zone 2 ZIPs** 33301, 33304, 33305, 33306, 33308, 33313, 33316: per visit is **$55**. Once the customer enters their address, the pay screen shows "$55 / visit" and "Or uncheck the package below to pay $55 / visit instead." The package card reads "Save $66 vs $220" (4 × $55 = $220, minus $154; arithmetic only).
- **Other or unknown ZIP:** $45 per visit, "Save $26 vs $180".
- **Always shown** on the offer card and the pay screen: "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service."
- **The server picks the charge from the ZIP:** `server.mjs` (test) and `worker.js` (go-live). A zone 2 per-visit payment is $55, and the package is $154 everywhere. Tested in the Stripe TEST sandbox. All test intents were cancelled.
- **Quote-to-paid test flow:** `ZONE2_PACKAGE_ENABLED=true`. Zone 2 gets pay-link 2a with $55 and the package still offered.

New hashes:
| File | sha256 |
|---|---|
| index.html (test) | 650f597fa0ba0d446c1d0db4c631cd64809eca0958f97cee88c44a4836e1b976 |
| dist/index.html (prod) | aa7190861a61eca1dab70fc74b257230ed181f9380b797204eb94698b449c113 |
| server.mjs | 522f1e8f3d8b1b68312a64c31cb0b73f61654d888e791a7ee446678748ff84a8 |
| worker.js | 7e505b3c55c17770273463982aa26285158411ca3b7018b31f8bf28f5fdc6a96 |
| lawns-flow/flow-server.mjs (+ proof/flow/code copy) | 4949207c75399964a1e974e54f1601ea48d89e604199d8a12672506264c6246d |

Checker after the change: `--test` PASS; pre-deploy `BUILD_OK`; `--deploy` FAIL on the pk (by design). Proof packet: `/workspace/proof-notes/lawns-zone2-offer-update-check-request-2026-11-07.md`.

## Rewards and seasonal promotion: NOT SET
Sisto said renewal comes with a rewards program and a seasonal promotion. No details are set, and none were added.
The page's account screen (shown after payment) says: "After your 4 visits: renew your 4-visit package for $139. Ask about rewards and seasonal offers." It names no rewards or promo terms. The "Seasonal offers" tab lists only add-ons, "Shrub & bed maintenance" and "Seasonal property cleanup", each marked "Quoted". These are the same add-ons the live site form offers, with no prices.
This does not block showing $154 vs $45.

## Matches the quote-to-paid TEST path (not live)
The test flow (`/workspace/lawns-flow/flow-server.mjs`, Stripe TEST sandbox, Make TEST clones all OFF) uses the same numbers:
- package $154 ("first cut $19, then 3 at $45")
- per visit $45, or $55 in zone 2
- renewal $139
- the same terms: no split, catch-up not replaced, account credit

Stripe TEST lookup keys: lbt_visit_small_biweekly_z1 $45, lbt_visit_small_biweekly_z2 $55, lbt_pkg4_small_biweekly $154, lbt_pkg4_renewal $139. Nothing in this flow is active on live traffic.

## Still blocked for go-live (each needs Sisto's own OK)
1. (Done: zone 2 decided Nov 7.) The live $55 Stripe price is needed at go-live.
2. Live Stripe products and prices, plus live keys in the Worker secrets. None exist yet, and there is no live payment link.
3. Going live: deploy the page (PR → Proof → merge only on his yes), set the real webhook, and fix the live-site conflicts. The site hero says "Every Week", and the FAQ says you pay after each visit, but the package is prepaid.
4. Customer text wording and 10DLC coverage for pay links and receipts.

## Questions that are truly Sisto's
1. **Go-live and live keys.** When you're ready, do you OK creating the live Stripe prices ($45, $55 zone 2, $154, $139) and putting this page live on lawnsbytimmy.com?
   *Recommendation:* fix the live site's "Every Week" hero and "pay after each visit" FAQ first. Then do one real low-dollar test with you before customers see it.

(Zone 2 is answered. Rewards and seasonal promo details are not asked now, because they aren't needed to show $154 vs $45/$55.)

## Kept out
The Oakland Park homestead plan (food forest, beds, animals, any new service or price) is **not** part of this offer.

## Nothing went live
No live Stripe changes, no real texts, no Make writes (one read-only module read), no website repo change, no deploy, no posts, no public tunnel.
