# Test Worker: book and pay

This is a test-only booking page. It does not run on the production Worker, and it refuses live Stripe keys. Nothing here charges a real card.

The production site keeps serving the quote form, the account page, and the missed-call flow as they are. `/book/` on production says booking isn't open yet until this test setup is deliberately copied over later, which is a separate decision.

## Deploy the test Worker

From the repo root, deploy this config, not `wrangler.jsonc`:

```bash
npx wrangler deploy -c wrangler.booking-test.jsonc
```

That publishes a Worker named `lbt-booking-test` on `workers.dev`. It does not attach `lawnsbytimmy.com` and it does not change the `lawnsbytimmy-website` Worker. Wrangler prints the `workers.dev` hostname. Open `/book/` on that hostname.

Do not run `wrangler deploy` without `-c` for this work. The default config is the production Worker and does not include the slot ledger.

## Secrets

Set these on `lbt-booking-test` only, with `npx wrangler secret put <NAME> -c wrangler.booking-test.jsonc`. Do not add them to `lawnsbytimmy-website`. Use placeholders here; paste the real values in the Wrangler prompt, not into the repo.

| Name | What it is |
|---|---|
| `BOOKING_MODE` | Already set to `test` in the test config. Any other value turns booking off. |
| `STRIPE_LBT_TEST_SECRET_KEY` | Stripe test secret, `sk_test_…` or `rk_test_…`. A live key is refused. |
| `STRIPE_LBT_TEST_PUBLISHABLE_KEY` | Stripe test publishable key, `pk_test_…`. |
| `STRIPE_BOOKING_WEBHOOK_SECRET` | Signing secret (`whsec_…`) for a Stripe **test** webhook endpoint. |
| `BOOKING_WEBHOOK_URL` | HTTPS URL of the test scenario that receives `availability_snapshot` and `booking_paid`. |
| `BOOKING_WEBHOOK_KEY` | Shared key. It is sent as the JSON `key` field. The scenario ignores calls without it. |

Optional plain vars on the test Worker:

| Name | What it is |
|---|---|
| `BOOKING_WINDOWS_CONFIRMED` | `yes` after the owner accepts the arrival windows. Until then the page says they are a proposal. |
| `BOOKING_CONFIG_JSON` | Optional schedule override. Example: `{"windows":[{"id":"0800-1000","label":"8–10 AM","start":"08:00","end":"10:00"},{"id":"1000-1200","label":"10 AM–12 PM","start":"10:00","end":"12:00"}],"capPerWindow":2,"minLeadDays":2,"maxLeadDays":21,"holdMinutes":15}` |

Prices stay in code: $154 for the package, $45 per visit, $55 per visit in zone 2. The ZIP decides the price on the server.

## Stripe test webhook

In the Stripe test dashboard, add an endpoint aimed at:

`https://<the workers.dev hostname>/api/stripe/booking-webhook`

Send these events:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `setup_intent.succeeded`

Put that endpoint's signing secret in `STRIPE_BOOKING_WEBHOOK_SECRET`. Delete the endpoint when the test is done. Do not point it at lawnsbytimmy.com.

## What the Worker sends

Both calls go to `BOOKING_WEBHOOK_URL` as JSON. The shared key is the `key` field.

Availability, before a hold and when the cached sheet is older than 5 minutes:

```json
{"event":"availability_snapshot","key":"<BOOKING_WEBHOOK_KEY>"}
```

The Worker reads a `valueRanges` reply for the Jobs tab. Column B is the service date (`M/D/YYYY`) and column G is `Job_Status` when the header row says so. Only `Scheduled` rows take a seat. A window is recognized when `Job_Notes` contains the window label, for example `Window 8–10 AM`. Rows with no window are spread across that day's windows.

A missing `calendar` or `blocks` field means there are no calendar blocks. The Worker does not fail the booking because of that. When a later reply includes a `blocks` array, an all-day event or a title starting with `LBT Block` closes that day or the overlapping window. Other calendar events do not.

`booking_paid` is sent once, after `payment_intent.succeeded`. Customer ids are `LC-` plus digits. Phone is `(xxx) xxx-xxxx`. Dates are `M/D/YYYY`. `visits` is four items, `{n, date, label}`, 14 days apart. `plan` is `package` or `per_visit`. `test` is true.

Any reply that is not HTTP success **and** JSON `{"ok":true}` is a failure. The Worker answers Stripe with 500 so Stripe retries. A body of `Accepted` (what you get if the scenario is in sequential mode, or the key is wrong) is a failure on purpose. `{"ok":true,"duplicate":true}` is success and does not write again. The scenario should stay non-sequential so it returns that JSON instead of queueing the call.

The PaymentIntent id is the idempotency key on the scenario side. The Worker also ignores a repeated Stripe event id.

## Schedule defaults

These are proposals, not a final decision:

- Tuesday–Saturday
- 8–10 AM and 10 AM–12 PM
- 2 visits per window
- Book 2 to 21 days ahead
- A seat is held for 15 minutes while the customer pays
- A window is offered only when all four visits (day 0, +14, +28, +42) have room

Zone 3 ZIPs, and yards over 5,000 sq ft, are not charged. The page sends those customers to the quote form and the free-estimate link.

## Account ids

New bookings use `LC-` plus digits so they match the original account check. Sign-in also accepts a web-lead id such as `LC-251120-143055` (and the shorter `LC-251108-1951` form). Missed-call ids (`MC-…`) are still not accounts.

Card saving on the account page still requires `LC-` plus digits. That path is unchanged.

## Tests

```bash
node --test src/booking/booking.test.js src/booking/page.test.js src/account/me.test.js src/account/card.test.js
```
