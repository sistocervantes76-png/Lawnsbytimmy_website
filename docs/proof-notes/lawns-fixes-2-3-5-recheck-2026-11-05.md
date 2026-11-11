# Recheck fixes 2, 3, 5 — 2026-11-05 ~2:32–2:40 PM ET
Verdict: PASS. Confidence ~90%.

## Fix 2 — TEST 6918616
- status inactive (OFF). lastEdit 2026-11-05T19:29:36.875Z (= 2:29:36 PM ET)
- Router order: STOP (route 0) → opt-in/start (1) → ACCEPT (2) → normal reply (3)
- Kind switch: stop/opt-out keys first, then start/unstop/yes, then accept, then reply/rating fallback
- STOP/opt-in/reply/ACCEPT write TEST_Msg_Log only ("Consent + email (TEST: logged only)" / "Email to Sisto (TEST: logged only)"); no RingCentral or Gmail send modules; Google connection only
- Backups before change: 6918616_before-stop-order_{scenario,modules}_20261105-1428.json (prior lastEdit 19:09:32Z). After: 6918616_after-stop-order_scenario_20261105-1429.json
- Note: no rating route in TEST clone (kind can classify rating but no route) — optional gap vs live 6691639, not part of fix 2 ask

## Fix 3 — 6671272
- Baseline present: 6671272_FIRST_BASELINE_{scenario,modules,diff}_20261105-1428.*
- lastEdit unchanged 2026-10-25T16:12:19.308Z (12:12:19 PM ET Oct 25)
- Deep config diff vs live module_get: NO DIFF (same module ids + config hash)

## Fix 5 — Offer page
- sha256 match expected: index c7a3a2e5…1707, dist 34aea108…4ad1, mode 444, mtime 2:30:02 PM ET
- 0843a47f / 6988aee7 copies not found; pre-tagging backup is d18a52ae / c5f58191 (post prior catch-up fix). Customer-facing text extract: 0 line differences vs that backup. JS only adds crmCustomerId + business/crm metadata on PI create payloads.
- payCatchupNote :319 includes "The $19 first-visit package rate does not replace catch-up." (both index + dist; also hero :275)
- Metadata set in server.mjs :94–95/:106–107, worker.js :124–125/:138–139 (Customer + PI), index/dist client payloads, flow-server.mjs Customer+PI for accept-link path
- Checker: --test EXIT 0; pre-deploy EXIT 0 BUILD_OK; --deploy EXIT 1 BUILD_FAIL (pk not pk_live_)
- pi_REDACTED: amount 15400, succeeded, livemode false; metadata business=lawns_by_timmy + crm_customer_id=LC-261105-1423; receipt_email null; Customer cus_REDACTED livemode false, email null, same two tags

## Playbook §10
- Now cites Lawns-chat sources for ACCEPT/card-on-file (user words + card pick). Lists pending as Sisto's (zone 2 $55/hide pkg, 72h, +14 days, Customer_ID collision, SMS wording). Flow diagram says STOP first then opt-in then ACCEPT.
