# Offer page — TEST build (not deployed)

These four files are a **sanitized** copy of the Lawns by Timmy offer/pay test build from `/workspace/lawns-offer-page` (and `flow-server.mjs` from that tree’s proof/flow code).

**This is a TEST build. It is not deployed. It is not what lawnsbytimmy.com serves today.**

- `index.html` — phone offer page (test copy: real Make webhook disabled; leads go to a mock endpoint in test).
- `server.mjs` — local test server. It refuses live Stripe secret keys and reads keys from a secrets path (the path is a placeholder here).
- `worker.js` — Cloudflare Worker stub used for the test/production split. It also refuses live Stripe secret keys.
- `flow-server.mjs` — TEST-only after-accept / pay-link service. `TEST_MODE` is true (texts are logged, never sent). Stripe test keys only.

Webhook URLs, spreadsheet IDs, Stripe account and price IDs, and secret file paths have been replaced with placeholders. Prefix checks such as `startsWith("sk_test_")` are kept so you can see how the test build refuses live keys; they are not actual keys.
