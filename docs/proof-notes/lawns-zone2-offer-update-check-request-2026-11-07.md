# Proof check request: zone 2 offer update (Nov 7, 2026)

**From:** Lawns. **Prepared:** Sat Nov 7, 2026, ~3:50 PM ET. TEST only, nothing live.

## Sisto's decision (exact words, via Alexander's card, Sat Nov 7, 2026)
"Show $55 per visit in those Fort Lauderdale ZIPs, keep the $154 package everywhere, and add that some ZIPs add a $10 trip fee to per-visit service."

Zone 2 ZIPs come from Make LBT_Quote 6246200 module 6 (read-only Nov 7 ~3:40 PM ET): 33301, 33304, 33305, 33306, 33308, 33313, 33316. In those ZIPs, trip = +10 and base = 45, so $55.

## Backups (taken before any change)
`/workspace/backups/zone2-offer-20261107-1543/` holds the earlier versions of every changed file, with `SHA256SUMS`. The page "before" hashes are the earlier Proof-passed ones (c7a3a2e5… test, 34aea108… prod).

Full unified diffs are in `/workspace/lawns-offer-page/proof/zone2/`: `index.html.diff`, `dist-index.html.diff`, `server.mjs.diff`, `worker.js.diff`, `flow-server.mjs.diff`.

## 1. Offer page (index.html test + dist/index.html prod, identical edits)
| Item | Before | After |
|---|---|---|
| Trip-fee line, offer card | (none) | "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service." (always shown, `#offerTripNote`) |
| Trip-fee line, pay screen | (none) | Same exact line (always shown, `#payTripNote`) |
| Per-visit price | Fixed `CONFIG.OFFER` $45 | `perVisit()`: $55 (`CONFIG.OFFER_ZONE2`, 5500) if the ZIP is in `CONFIG.ZONE2_ZIPS` (the 7 ZIPs), else $45. Unknown or other ZIP: $45 |
| Offer card "Or $X / visit" | $45 | $45 before the ZIP is known (the offer card comes before the address). Refreshed to $55 after a zone 2 ZIP |
| Pay line / Due today (unchecked) | "$45 / visit, bi-weekly" $45 | "$55 / visit, bi-weekly" $55 in zone 2; $45 otherwise |
| Uncheck note | "Or uncheck the package below to pay $45 / visit instead." | Same text, with $55 in zone 2 |
| Package card text | "First visit just $19, then 3 visits at $45. Save $26 vs $180." | Zone 1/other: unchanged. Zone 2: "…Save $66 vs $220." (4×$55 = $220; $220 − $154 = $66). **Arithmetic from his prices. Please confirm OK to show.** |
| Package line / Due today (checked) | "4-visit package · $19 first, then 3 at $45" $154 | Unchanged in every zone |
| Account plan price (per-visit) | "$45 / visit" | Per-ZIP price + " / visit" |
| Payment request body | offer_id, save_card, upsell… | Adds `zip: state.zip`. Gate code (test vs prod) unchanged |

Gate check: the set of `diff index.html dist/index.html` lines is identical before and after (`GATES_UNCHANGED`). Both files are back at mode 444.

## 2. Payment servers (so a zone 2 customer is actually charged $55, not $45)
These were not named in the brief. I changed them because otherwise the page would show $55 and charge $45. Please confirm this is in scope.
- `server.mjs` (local TEST server) and `worker.js` (go-live Worker, not deployed): the server works out zone 2 from the posted ZIP, and the browser cannot set the amount.
  - Per visit: 5500 in zone 2, 4500 otherwise.
  - Package: 15400 everywhere.
  - Description for zone 2: "Small-yard bi-weekly visit $55 incl. $10 trip fee (recurring only)".
  - `server.mjs` adds `metadata[zone]`.
  - `worker.js` adds env `STRIPE_OFFER_ZONE2_PRICE_ID` and `STRIPE_OFFER_ZONE2_AMOUNT_CENTS` (default 5500).
  - The live-key refusal guards are untouched. Both files are back at mode 444.
- **TEST API results** (Stripe TEST acct_REDACTED, livemode false; all intents cancelled afterwards, none confirmed or charged):

| Case | Amount | Intent |
|---|---|---|
| 33301 per visit | 5500 | pi_REDACTED |
| 33316 per visit | 5500 | pi_REDACTED |
| 33334 per visit | 4500 | pi_REDACTED |
| no ZIP | 4500 | pi_REDACTED |
| 33301 package | 15400 | pi_REDACTED |
| 33304 package → per-visit update | 5500, description "…$55 incl. $10 trip fee…", metadata zone=2, business=lawns_by_timmy | pi_REDACTED |

- **Headless UI check** (local 127.0.0.1 only, no tunnel; `proof/zone2/ui-check.json` + PNGs):
  - Zone 2, ZIP 33301:
    - offer card shows $45 + trip line
    - pay screen defaults to package $154, "uncheck … $55 / visit", "Save $66 vs $220"
    - after uncheck: Due today $55, PI amount 5500 (pi_REDACTED, cancelled)
  - Zone 1, ZIP 33334:
    - $154 default, "$45 / visit", "Save $26 vs $180"
    - after uncheck: $45, PI 4500 (pi_REDACTED, cancelled)

## 3. Quote-to-paid TEST flow (`/workspace/lawns-flow/flow-server.mjs`; synced copy `/workspace/lawns-offer-page/proof/flow/code/flow-server.mjs`, same sha)
| Item | Before | After |
|---|---|---|
| Flag | `ZONE2_PACKAGE_ENABLED = false; // PENDING SISTO…` | `ZONE2_PACKAGE_ENABLED = true; // Sisto decided Nov 7, 2026: package ($154) everywhere; $55 per visit in zone 2 ZIPs ($45 + $10 trip fee).` |
| Zone 2 pay-link text | "Thanks [First]! Book Lawns by Timmy here: [link] $55 per visit (includes the $10 trip fee for your area); your card is saved and charged after each visit. Bi-weekly only. Link good for 3 days. Reply STOP to opt out." | Branch removed. Every zone uses 2a: "Thanks [First]! Book Lawns by Timmy here: [link] Choose the 4-visit package ($154 today: first cut $19, then 3 at $45) or ${v} per visit (card saved, charged after each visit). Bi-weekly only. Link good for 3 days. Reply STOP to opt out." ${v} = $55 in zone 2 |
| Pay page TERMS | (no trip line) | Adds "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service." |
| Zone 2 per-visit option note | "Includes the $10 trip fee for your area." | Unchanged (kept, consistent with the decision) |

The flow service was **not** run after this change: no Make, CRM or SMS activity. `node --check` passed. Links created before Nov 7 keep their stored `pkgAllowed` (test data only).

## 4. Docs
- `/workspace/playbooks/lawns-test-msg-log-draft-packet-2026-11-07.md`:
  - records his decision
  - 2a now covers all zones, with a $55 example
  - old 2b retired
  - says sending is still not approved
- `/workspace/playbooks/lawns-booking-payment-playbook.md`:
  - zone 2 moved from pending to decided
  - still pending: live 6246200 Customer_ID fix; SMS/consent wording incl. the 72-hour line
  - go-live note on the Worker zone 2 price env
- `/workspace/playbooks/lawns-offer-from-package-prices-2026-11-07.md`: zone 2 section now says decided; Sisto questions reduced to go-live/live keys.

## New hashes (sha256)
| File | Hash |
|---|---|
| lawns-offer-page/index.html | 650f597fa0ba0d446c1d0db4c631cd64809eca0958f97cee88c44a4836e1b976 |
| lawns-offer-page/dist/index.html | aa7190861a61eca1dab70fc74b257230ed181f9380b797204eb94698b449c113 |
| lawns-offer-page/server.mjs | 522f1e8f3d8b1b68312a64c31cb0b73f61654d888e791a7ee446678748ff84a8 |
| lawns-offer-page/worker.js | 7e505b3c55c17770273463982aa26285158411ca3b7018b31f8bf28f5fdc6a96 |
| lawns-flow/flow-server.mjs (and proof copy) | 4949207c75399964a1e974e54f1601ea48d89e604199d8a12672506264c6246d |

## Checker (Nov 7 ~3:45 PM ET)
- `--test`: exit 0, TEST_COPY_HAS_CHROME (flags: 4242, ?mock=1, MOCK_LEAD_URL, /mock/lead, pk_test, LBT_TEST_BUILD true)
- pre-deploy: exit 0, `BUILD_OK`
- `--deploy`: exit 1, "publishable key is not pk_live_" (by design)

## What to confirm
- [ ] Package is not hidden in any zone (page + flow).
- [ ] The trip-fee line wording matches his decision exactly and shows everywhere.
- [ ] $55 only for the 7 ZIPs; $45 for other or unknown ZIPs; no zone 3 price invented.
- [ ] $154 / "$19 first, then 3 at $45" unchanged; the $19 never stands alone.
- [ ] Save $26/$180 vs $66/$220 arithmetic is OK to show.
- [ ] The server-side $55 charge change (outside the brief's file list) is in scope.
- [ ] No rewards, promo, or catch-up $ added. No homestead content.

## Nothing went live
- No deploy, merge or repo change.
- No public tunnel; the local server was stopped.
- No Make writes; the only Make call was read-only.
- No live Stripe; all TEST intents were cancelled.
- No texts or emails sent.
