# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing site for lawnsbytimmy.com (lawn care, Oakland Park / Fort Lauderdale FL) plus a small customer account area. Plain HTML/CSS/JS with no build step, no package.json, no tests, and no linter. The owner is non-technical, so README and `docs/` are written in plain, step-by-step language; keep new docs in that style.

## Commands

- Preview the static site: open `index.html` in a browser (no server needed).
- Run the full site including the account API locally: `npx wrangler dev`. Secrets go in a git-ignored `.dev.vars` (`STRIPE_SECRET_KEY`, `SESSION_SECRET` ≥32 chars, `ACCOUNT_WEBHOOK_URL`). Add `DEV_SHOW_LOGIN_LINK=true` there to get the sign-in link in the API response instead of an email; never set it in Cloudflare.
- Deploy: merging to `main` auto-deploys the `lawnsbytimmy-website` Cloudflare Worker (Cloudflare's Git build integration). There is no CI in this repo. Vercel is not used.

## Architecture

**One Cloudflare Worker serves everything** (`wrangler.jsonc`). Static assets are served from the repo root via the `ASSETS` binding; `src/worker.js` only intercepts `/api/account/*`, mapping each path to a module in `src/account/` and dispatching by HTTP method to an exported `onRequestGet` / `onRequestPost` (Pages-Functions-style names, called with `{ request, env, ctx }`). Unknown `/api/*` → 404 JSON; everything else falls through to static files.

**`.assetsignore` controls what is public.** Because the asset directory is the repo root, any new non-public file or folder (docs, config, source) must be added there or it gets published.

**Lead form** (`index.html`, inline `<script>` at the bottom): posts JSON `{ event: "lead_form_submitted", timestamp, lead_data: {...} }` directly from the browser to a hard-coded Make.com webhook (`LEAD_WEBHOOK_URL`). Make's "LBT_Quote" scenario consumes this shape (CRM row, quote email, owner alert), so renaming or removing `lead_data` fields breaks the downstream automation. `docs/webhook-setup.md` documents the payload but is slightly behind the code (code also sends `sms_consent` and `lot_size`).

**Customer account** (`account/index.html` page + `src/account/*` API):
- Passwordless email sign-in. Only emails that exist as Stripe customers can sign in; `login.js` always returns the same generic reply so it can't be used to probe who is a customer.
- Tokens are stateless HMAC-signed payloads (`lib.js` `signToken`/`verifyToken`, keyed by `SESSION_SECRET`, with a `p` purpose field: `"login"` or `"session"`). Rotating `SESSION_SECRET` signs everyone out.
- `verify.js` GET only renders a confirm button; POST consumes the link and sets the `lbt_session` cookie. This two-step is deliberate (email scanners pre-open links), so don't collapse it.
- Optional bindings degrade gracefully: rate limiters (`LOGIN_IP_LIMITER`, `LOGIN_EMAIL_LIMITER`) treat errors as "not limited", and the `LOGIN_LINKS` KV store (one-time links, email cooldown) is commented out in `wrangler.jsonc` until created. Code must keep working when either is absent.
- Stripe is called via raw `fetch` in `lib.js` `stripe()` (form-encoded, restricted `rk_live_` key). `STRIPE_API_BASE` can override the host.
- All outbound Make.com traffic goes through `lib.js` `sendToMake()` to one `ACCOUNT_WEBHOOK_URL`; the `event` field (`account_login_link`, `account_lookup`, `service_request`) routes it inside the Make scenario. `account_lookup` expects a JSON webhook response with CRM fields; the dashboard must still load if that fails.
- State-changing POSTs check `sameOrigin()`.

Setup steps for Stripe, Make, and Cloudflare are in `docs/customer-dashboard-setup.md`.

## Content rules

- The business is not licensed/insured yet: don't add copy claiming it.
- Customer communication is by email (SMS registration pending), so site copy says quotes come by email, not text.
- Business phone (954) 880-3500 and info@lawnsbytimmy.com appear in several places (`index.html`, `account/index.html`, `PHONE` in `src/account/lib.js`); change all together.
