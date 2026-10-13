# Customer Dashboard (lawnsbytimmy.com/account): Setup

Customers go to **lawnsbytimmy.com/account** (or click **My Account** in the site header), type their email, and get a sign-in link. No passwords. Once they're in, they see:

- **Their service:** next visit date, schedule, and services
- **Their property:** address and gate/pet/access notes, from your CRM sheet
- **Billing:** the card on file (brand, last 4 digits, expiration) and a button that opens Stripe's secure billing page, where they can update the card and download receipts
- **Recent payments:** their last 12 charges, each with a receipt link
- **Need something?:** skip a visit, request an extra service, update access notes, or something else. The request goes to you through Make.com.

Only customers who already exist in **Stripe** with that email can sign in.

---

## How it works (in plain words)

| Piece | Where it lives | What it does |
|---|---|---|
| `account/index.html` | Your site | The sign-in and dashboard page customers see |
| `src/` + `wrangler.jsonc` | Cloudflare Worker `lawnsbytimmy-website` (deploys automatically from GitHub) | Checks the customer in Stripe, sends the sign-in link, loads their info, opens the billing page |
| Stripe | Your Stripe account | Card on file, payments, receipts, billing page |
| Make.com webhook | A new Make scenario | Emails the sign-in link, looks up the CRM row, logs requests |

---

## Step 1: Turn on Stripe's billing page

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**.
2. Turn on: **Update payment methods** and **View invoice history**.
3. Under **Business information**, add your phone, `info@lawnsbytimmy.com`, and links to `https://lawnsbytimmy.com/terms.html` and `https://lawnsbytimmy.com/privacy.html`.
4. Click **Save**. (Do this for **Live mode**. Repeat in **Test mode** if you want to test first.)

## Step 2: Make a Stripe "restricted key"

This is a limited key that can only do what the dashboard needs, which is safer than your main secret key.

1. Stripe → **Developers** → **API keys** → **Create restricted key**.
2. Name it `lawnsbytimmy-website-dashboard`.
3. Set these permissions (leave everything else as **None**):
   - **Customers:** Read
   - **Charges:** Read
   - **PaymentMethods:** Read
   - **Customer portal:** Write
4. Create it and copy the key (starts with `rk_live_`).

## Step 3: Add the Make.com scenario

Create **one** new scenario: **Webhooks → Custom webhook**. Name it "Lawns by Timmy — Customer Account" and copy its URL. Then add a **Router** with 3 paths, filtered on the `event` field:

**Path A, `event` = `account_login_link`** (sends the sign-in email)
- Gmail → **Send an email** from `info@lawnsbytimmy.com`
  - To: `email`
  - Subject: `Your Lawns by Timmy sign-in link`
  - Body (example):
    > Hi {{first_name}},
    > Tap here to open your account: {{login_url}}
    > This link works for {{expires_minutes}} minutes. If you didn't ask for it, you can ignore this email.

**Path B, `event` = `account_lookup`** (fills in the property section)
- Google Sheets → **Search Rows** in "Lawns By Timmy CRM" where `Email` = `email` (limit 1)
- Webhooks → **Webhook response**, status `200`, body:
  ```json
  {
    "first_name": "{{First_Name}}",
    "service_address": "{{Service_Address}}",
    "city": "{{City}}",
    "zip": "{{Zip}}",
    "frequency": "{{Frequency}}",
    "services": "{{Services}}",
    "access_notes": "{{Access_Notes}}",
    "status": "{{Status}}",
    "next_service_date": "{{Next_Service_Date}}"
  }
  ```
  Use a date format like `2026-10-16` for `next_service_date`. If you don't track it yet, leave it blank: the banner then says "On your regular route day".

**Path C, `event` = `service_request`** (customer asked for something)
- Google Sheets → **Add a Row** to a new "Requests" tab: timestamp, email, request_label, date, message
- Then notify yourself however you like (email, RingCentral text, etc.)

> **CRM sheet:** add an **`Email`** column (and optionally **`Next_Service_Date`**) to "Lawns By Timmy CRM". The email has to match the one in Stripe.

## Step 4: Add the settings in Cloudflare

Cloudflare dashboard → **Workers & Pages** → **lawnsbytimmy-website** → **Settings** → **Variables and Secrets** → **Add**. Pick type **Secret** for all three. That keeps them hidden, and they survive every deploy.

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | The `rk_live_...` key from Step 2 |
| `SESSION_SECRET` | A long random string, at least 32 characters. Generate one at any password generator and **never share it**. |
| `ACCOUNT_WEBHOOK_URL` | The Make webhook URL from Step 3 |

Merging the pull request redeploys the site automatically. If you add the secrets after merging, they take effect right away.

## Step 5: Test it

1. Make sure your own email is a customer in Stripe.
2. Go to `lawnsbytimmy.com/account`, enter your email, and click the link in the email.
3. Check that you see your card, payments, and property info. Tap **Update card & view receipts**, and send a test request.

---

## Good to know

- **Sign-in links** expire after 15 minutes. Customers stay signed in for 30 days on that device.
- **Security:** card numbers never touch your site. Customers only see the last 4 digits, and card changes happen on Stripe's own page. Each customer can only see their own account.
- **Changing `SESSION_SECRET`** signs everyone out (handy if you ever need to).
- **Optional:** in Cloudflare → Security → WAF → Rate limiting rules, limit `/api/account/login` to about 5 requests per minute per IP to stop spam sign-in emails.
- **Testing on your own computer:** copy the Step 4 values into a `.dev.vars` file (it's git-ignored) and run `npx wrangler dev`. Add `DEV_SHOW_LOGIN_LINK=true` to show the sign-in link on screen instead of emailing it. **Never set that in Cloudflare.**
