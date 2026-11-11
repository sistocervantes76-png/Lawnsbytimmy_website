# Proof check request: Lawns offer from Sisto's package prices (Nov 7, 2026)

**From:** Lawns. **Prepared:** Sat Nov 7, 2026, ~3:45 PM ET.
**Ask:** Sisto (to Alexander, Nov 7 ~3:38 PM ET): "use the package prices to create lawns by timmys offer."
**Summary for Sisto:** `/workspace/playbooks/lawns-offer-from-package-prices-2026-11-07.md`
**Result:** the existing Proof-passed page already fulfills the ask, so the copy was not changed. The production copy was missing on the box and has been restored byte-for-byte (details below).

## Files, hashes, checker
| File | sha256 | Mode |
|---|---|---|
| /workspace/lawns-offer-page/index.html (test) | c7a3a2e51a7f38fca5f7c5515706861d4d0817691feb1160efd8bc4a5f311707 | 444 (untouched) |
| /workspace/lawns-offer-page/dist/index.html (prod) | 34aea108dccd4819409ccbf201b0504792536ae36847d6f0a60a4179af604ad1 | 444 |

- Both hashes equal the last Proof pass (fixes 2/3/5 recheck, `proof/flow/tagging-sha256.txt`).
- **dist/ restore, please verify:**
  - The file was absent on Nov 7.
  - Rebuilt from `/workspace/backups/offer-tagging-20261105-1428/dist-index.html` (sha c5f58191…), using `patch` with `/workspace/lawns-offer-page/proof/flow/dist-index.html.diff`.
  - The result hashes to 34aea108…, which matches.
- `diff index.html dist/index.html` shows gate lines only: LBT_TEST_BUILD, USE_REAL_WEBHOOK/MOCK_LEAD_URL, pk placeholder, isTestMode, leadEndpoint, test-card hint, default ZIP 33334 in the test copy.
- Checker (Nov 7 ~3:40 PM ET):
  - `--test` exit 0 (flags: 4242, ?mock=1, MOCK_LEAD_URL, /mock/lead, pk_test, LBT_TEST_BUILD true)
  - pre-deploy exit 0 `BUILD_OK`
  - `--deploy` exit 1, "publishable key is not pk_live_" (by design)

## Every customer-facing price and term → source
| # | Page text (index.html line) | Source | Sisto-decided or Lawns? |
|---|---|---|---|
| 1 | "Your first cut is $19" (267) | Sisto Nov 5 1:41 PM ET via Alexander: "offer should be 19 dollars first visit or wow 19 dollars first cut"; Proof PASS lawns-offer-19-first-cut-2026-11-05.md | Sisto |
| 2 | "When you start the 4-visit bi-weekly package — $154 up front ($19 first, then 3 at $45)." (268) | Sisto Nov 5 prices; booking playbook §4; Nov 7 ask | Sisto (prices); Lawns wording |
| 3 | "Or $45 / visit, bi-weekly" (270–271) | Sisto Nov 5, small yard $45 bi-weekly; Make 6246200 module 6 smallbiweekly=45 (read-only Nov 7 ~3:40 PM ET) | Sisto |
| 4 | "For recurring bi-weekly service only — not one-time cuts. Package visits can't be split." (274); pay 317; upsell 328 | Sisto Nov 5; playbook §4 | Sisto |
| 5 | "Lawns not cut in over 10 days need a one-time catch-up service first, quoted separately. The $19 first-visit package rate does not replace catch-up." (275, 319) | Sisto: catch-up still applies on top; 10-day rule from live site home.html:553; no $ amount in any source | Sisto (rule); 10 days = live-site copy |
| 6 | "Small yard = up to 5,000 sq ft. Final price confirmed after a quick yard-size check." | Sisto Nov 5 (up to 5,000 sq ft); "confirmed after check" = Lawns wording | Size Sisto; check wording Lawns |
| 7 | Pay default: "4-visit package · $19 first, then 3 at $45 — $154", "Due today $154" (315–316) | Playbook §1.4; Proof 19-first-cut note "pay defaults to $154 package (Lawns UI call)" | Lawns UI choice |
| 8 | "Or uncheck the package below to pay $45 / visit instead." (321) | Same prices | Lawns wording |
| 9 | "4 visits for $154 / First visit just $19, then 3 visits at $45. Save $26 vs $180." (326–327) | $180 = 4×$45, $26 = $180−$154 (arithmetic, not a new price) | Lawns wording; please confirm OK to show |
| 10 | "If you cancel the package early, unused visits become account credit. No cash refunds." (318, 329) | Sisto Nov 5 (relayed again Nov 7) | Sisto |
| 11 | Account: "After your 4 visits: renew your 4-visit package for $139. Ask about rewards and seasonal offers." (398) | Sisto: renewal 10% off = $139 (from $138.60); public copy uses "renew for $139", not "10% off", per launch plan; rewards/seasonal promo mentioned by Sisto, **details NOT set** | $139 Sisto; "ask about rewards" Lawns wording; flag |
| 12 | "Seasonal offers": "Shrub & bed maintenance — Quoted", "Seasonal property cleanup — Quoted" (424–427) | Same add-ons as live site form home.html:702–707; no prices | Existing site services, no $ |
| 13 | "Package: visits 1–4 prepaid. Per-visit plan: charged after each completed visit." | Quote-to-paid TEST design (playbook §10); Sisto: "put their card on file to pay when it's done" | Sisto (concept) |
| 14 | SMS consent line under Get a Quote | Unchanged from prior Proof pass | n/a |

## Negative checks done (grep on index.html, worker.js, server.mjs)
- No "$40", "10% off", or "rewards" detail. The only "rewards" text is #11.
- No "$55" or trip fee on the offer page.
- $19 always appears together with "package" or "then 3 at $45".

## Recommended vs decided
- **Zone 2 is still OPEN.** The page shows flat $45. The TEST flow hides the package in zone 2 and shows $55. Neither is a decision.
- Lawns' recommendation A (keep $154 everywhere; $55 per visit in 33301/33304/33305/33306/33308/33313/33316; add "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service.") is a **recommendation only** and is not implemented.
- Lawns UI/wording choices: rows 6 (check wording), 7, 8, 9, 11 ("ask about" line).

## Alignment with the quote-to-paid TEST flow (/workspace/lawns-flow/flow-server.mjs)
- Package $154 "first cut $19, then 3 at $45"; per visit $45 / $55 zone 2; renewal $139.
- TERMS list matches rows 4, 5, 10, 11.
- Stripe TEST lookup keys: z1 $45, z2 $55, pkg4 $154, renewal $139. All TEST, all Make TEST clones OFF.

## Other notes for Proof
- `/workspace/playbooks/lbt-quote-45-change.md` header still says "PREPARED ONLY, NOT APPLIED". Live read Nov 7 shows 45 applied, and the booking playbook says it was applied Nov 5 12:55 PM ET and Proof passed. Header is stale; not edited.

## Homestead kept out
Nothing from `/workspace/playbooks/sisto-oakland-park-homestead-plan-nov7-2026.md` (food forest, beds, animals, new services or prices) is in the page, the summary, or this packet.

## Not done / nothing live
- No live Stripe, real texts, Make writes, repo change, deploy, post, or public tunnel.
- Only external call: a read-only Make `scenario_module_get` (6246200, module 6).
