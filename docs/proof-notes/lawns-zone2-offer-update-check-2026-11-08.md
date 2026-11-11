# Lawns zone 2 offer update — Proof source check

**Verdict: PASS — local TEST-only consistency against Alexander-reported Nov 7 card selection.** Not independent verification of the original card, typed user approval, live charging scope, or production clearance.

**Reviewed:** November 8, 2026, 2:25 PM EST (America/New_York).

## Source and method
- Packet: `/workspace/proof-notes/lawns-zone2-offer-update-check-request-2026-11-07.md`.
- Recomputed packet SHA256: `f903a84a8128690843bb2b03ab20f2f4fa071c3cee670b970e29aef6ccc1d14c` — matches supplied f903a84a…d14c.
- Zone 2 selection is **Alexander-reported**, not independently visible typed user text. The packet calls its quotation “exact words”; this review does not independently substantiate that characterization.
- Inspected only local supplied files/backups/evidence and specifically referenced local amount configuration. No service imported or started; no secrets loaded; no network calls, messages, deploys, Stripe/Make writes, or production file edits.
- Compared all five supplied unified diffs to fresh GNU diffs: every hunk matches. Eight backup manifest entries all rehash correctly. Test/prod gate differences are identical before and after.
- Re-executed isolated pure pricing/UI snippets and payment handlers with an in-memory Stripe stub. No Stripe request was made. All 100,000 five-digit ZIP strings were tested per page/server classification; only the seven specified ZIPs select zone 2. Each page passed 11 package/per-visit summary cases; each payment server passed 40 create/update cases.

## Recomputed current SHA256 hashes (all match Lawns’ claims)
| File | Computed SHA256 |
|---|---|
| `/workspace/lawns-offer-page/index.html` | `650f597fa0ba0d446c1d0db4c631cd64809eca0958f97cee88c44a4836e1b976` |
| `/workspace/lawns-offer-page/dist/index.html` | `aa7190861a61eca1dab70fc74b257230ed181f9380b797204eb94698b449c113` |
| `/workspace/lawns-offer-page/server.mjs` | `522f1e8f3d8b1b68312a64c31cb0b73f61654d888e791a7ee446678748ff84a8` |
| `/workspace/lawns-offer-page/worker.js` | `7e505b3c55c17770273463982aa26285158411ca3b7018b31f8bf28f5fdc6a96` |
| `/workspace/lawns-flow/flow-server.mjs` | `4949207c75399964a1e974e54f1601ea48d89e604199d8a12672506264c6246d` |
| `/workspace/lawns-offer-page/proof/flow/code/flow-server.mjs` | `4949207c75399964a1e974e54f1601ea48d89e604199d8a12672506264c6246d` |

## Recomputed backup hashes / prior-pass anchors
| Backup | Computed SHA256 |
|---|---|
| `index.html` | `c7a3a2e51a7f38fca5f7c5515706861d4d0817691feb1160efd8bc4a5f311707` |
| `dist-index.html` | `34aea108dccd4819409ccbf201b0504792536ae36847d6f0a60a4179af604ad1` |
| `server.mjs` | `01fceef93271e8d18eae1168b6cf291a4f8fae1071b039c010323772e3893a9e` |
| `worker.js` | `71aaf928c93de890c495e13269c64e736c211dd0b8e2e2fa4441cd551902f502` |
| `flow-server.mjs` | `cba9e86c8612fc784b7104ba77c60b0b327586efcbff23c242ce0f09c9bbe61a` |

- Backup test index exactly matches prior passed `c7a3a2e51a7f38fca5f7c5515706861d4d0817691feb1160efd8bc4a5f311707`.
- Backup dist exactly matches prior passed `34aea108dccd4819409ccbf201b0504792536ae36847d6f0a60a4179af604ad1`.
- Current hashes differ from backups as expected for this update; all changes are accounted for by the supplied diffs. The proof flow copy is byte-identical to the working flow server.

## Offer / ZIP / charge findings — PASS against packet
- Both page copies use exactly 33301, 33304, 33305, 33306, 33308, 33313, 33316 (`index.html:488–497,573–607`; dist equivalent). Unknown/other ZIPs show $45. ZIP+4 uses its first five digits. Normal UI obtains the five-digit ZIP via parseAddress (`561–570`).
- Before address submission, the offer card shows $45 because ZIP is unknown. After a zone 2 address is submitted, refreshed offer/payment summaries show $55. This matches packet §1, rather than claiming initial geo-detection.
- Package is $154 for every ZIP on the offer page; default stays checked. The trip-fee sentence appears on offer and payment screens, exactly: **Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service.**
- Small yard remains up to 5,000 sq ft, recurring bi-weekly, with yard-size verification; base $45 and zone 2 total $55 are not new yard-size prices.
- Read packet §2 carefully: it explicitly requests the **total 5500-cent** per-visit PaymentIntent in zone 2, not a 4500-cent intent plus a later fee. `server.mjs:90–94,149–160` and `worker.js:77–91,124–133,203–211` implement that total in both create/update paths. Descriptions state $55 includes the $10 trip fee. No second $10 addition was found. Package branch stays 15400, with no trip fee.
- Local non-secret amount configuration contains offer=4500, package=15400, no offer_zone2 override; server falls back to 5500. Worker defaults are 4500/5500/15400 but environment overrides exist. Remote bindings were not inspected; this is not certification of deployed amounts. Worker price IDs are metadata, not an additional charge.
- Payment amount is computed from ZIP and upsell flag, not a browser-supplied amount; offline tests submitted amount=1 and observed the correct generated amounts. This does not certify address/ZIP trust or overall endpoint security.
- Flow is a **different payment-timing path**: `flow-server.mjs:196–219,229–231` uses SetupIntent for per-visit, $0 today, then quoted-price charge after service (`383–396`). Offer page creates a PaymentIntent and shows Due today $45/$55. This distinction predates the update; do not describe them as identical checkout behavior.
- New eligible zone 1/2 flow links both permit package (`32,177–178,203,230`). Unknown/outside zones remain manual quote (`163–175`), not automatic $45 flow checkout. Existing stored links retain old pkgAllowed; regenerate a TEST link to test new package eligibility. “Everywhere” does not mean the flow now invents an automatic outside-zone price.
- Flow prices come from test-price lookup keys and CRM consistency checks; actual Stripe price objects and historical intent/cancellation claims were not re-fetched. Existing $139 renewal/catch-up wording is unchanged, not newly approved here.

## Savings and $19 fairness — PASS
- $19 + 3 × $45 = $154. Outside zone 2: 4 × $45 = $180, saving $26. Zone 2: 4 × $55 = $220, saving $66. Comparison is four regular per-visit services vs four prepaid services.
- $19 is not offered as an independent one-time cut: hero immediately conditions it on the 4-visit bi-weekly package and $154 upfront (`267–275`); package cards/summary preserve that condition (`316–330,577–580`). Recurring-only, cannot-split, early-cancellation account-credit/no-cash-refund and catch-up exclusions remain.
- Visually inspected all five supplied PNGs, plus ui-check.json: zone 2 package is $154 with Save $66 vs $220; unchecked is $55; zone 1 package is $154 with Save $26 vs $180; unchecked is $45. These are Lawns’ saved screenshots, not new live browser/API execution.

## Live guards / TEST-only / deployment boundary
- Server loadSecret, loadPublishable, and assertTestAccount source blocks are unchanged from backup: refuse live keys, require test prefixes and expected test account, reject livemode=true. No credential value was read or changed.
- Worker keyMode and create/update/status guards are unchanged; isolated create/update tests with a fake sk_live_-prefixed string returned 403 with zero stub Stripe calls. /api/config remains test-publishable-only.
- Flow’s prefix (test pk guard, TEST_MODE=true, TEST tabs and secret-path references), stripe/assertTest import, and startup assertTest call are unchanged. Imported stripe.mjs was not re-audited; no blanket claim about its current contents or external secret stores.
- Both pages, server.mjs and worker.js remain mode 0444. Test-vs-prod gate diff is unchanged.
- **Important:** dist/index.html is a **production-target artifact**, NOT a mock-safe TEST page: LBT_TEST_BUILD=false, USE_REAL_WEBHOOK=true, live-pk placeholder. Do not serve/submit it for a TEST. Its existence is not evidence of deployment. Worker still refuses live Stripe keys. Production enablement requires a separate approved change/review.
- Packet explicitly says nothing deployed, merged, tunneled, sent, or changed in live Stripe/Make. Named files do not assert a completed deployment. Source/docs instead list pending go-live steps. Default local ports 8765 and 8770 had no listener during review. This supports the local TEST-only account; it is **not independent proof of historical or remote non-deployment**.
- Server-side charge edits are outside the original page-only file list but explicitly disclosed in packet §2 and technically match it. They may be reviewed as TEST code; this verdict does not expand the reported card selection into authorization to change production charging.

## Replacements / clearance
**Required functional replacements: none for this scoped TEST check.** No source file was changed. Overall PASS does not authorize sends, production use, or deployment.

Recommended provenance clarification (copy-paste; do not rewrite the packet during this audit):

In the request packet, replace:
```text
## Sisto's decision (exact words, via Alexander's card, Sat Nov 7, 2026)
```
with:
```text
## Alexander-reported Nov 7 card selection (not independently viewed by Proof)
```
and insert immediately after the reported quote:
```text
Source boundary: Alexander reported this card selection. Proof has not independently viewed the card or a typed user instruction. This check establishes consistency with the reported selection only; it is not production, charging, sending, or deployment authorization.
```

Replace the checklist line:
```text
- [ ] The trip-fee line wording matches his decision exactly and shows everywhere.
```
with:
```text
- [ ] The trip-fee line matches the specified implementation wording: “Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service.” It appears on the offer and pay screens. The underlying card selection is Alexander-reported, not independently viewed by Proof.
```

Use the same Alexander-reported / not independently viewed qualification whenever summarizing “decided by Sisto” comments or playbook headings. No independent card approval is established by repetition across files.

## Audit files
- `/workspace/proof-notes/lawns-zone2-offer-update-verdict.json` — structured verdict, hashes, boundaries, optional provenance replacements.
- `/workspace/proof-notes/lawns-zone2-offline-evidence-2026-11-08.json` — full hashes for packet, backups, docs, diffs, UI JSON, PNGs, guard/diff/mode results.
- `/workspace/proof-notes/lawns-zone2-offline-check-2026-11-08.mjs` and `lawns-zone2-offline-tests-2026-11-08.json` — reproducible offline tests/results.
- Syntax checks pass for server.mjs, flow-server.mjs and worker.js as ESM. Initial plain Node check treated worker.js as CommonJS and rejected export default; rerunning with --input-type=module --check passed, without altering worker.js.
