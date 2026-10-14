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

## Step 4b: Make sign-in links one-time-use

Without this step sign-in still works, but a link can be reused for its full 15 minutes (for example, if a customer forwards the email).

1. Cloudflare dashboard → **Storage & Databases** → **Workers KV** → **Create instance**. Name it `lawnsbytimmy-login-links`.
2. Copy its **ID** (a long string of letters and numbers).
3. In `wrangler.jsonc`, turn on the `kv_namespaces` block at the bottom and paste the ID there (the file says exactly what to change). Commit to `main` and it redeploys.

Spam protection on the sign-in form is already built in and needs no setup: 5 tries a minute per visitor, and at most 2 sign-in emails a minute per address (1 a minute once Step 4b is done).

## Step 4c: Point lawnsbytimmy.com at the Worker

The site has to be served by the **lawnsbytimmy-website** Worker, or `/account` and the sign-in code won't exist on the live site.

1. Cloudflare dashboard → **Workers & Pages**. If an older **Pages** project has `lawnsbytimmy.com` attached, open it → **Custom domains** → remove `lawnsbytimmy.com` (and `www.lawnsbytimmy.com` if listed). Don't delete the project yet, so you can switch back if needed.
2. Open the **lawnsbytimmy-website** Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → `lawnsbytimmy.com`. Repeat for `www.lawnsbytimmy.com` if you use it.
3. Same Worker → **Settings** → **Build**: make sure it is connected to this GitHub repo on the `main` branch, so every merge deploys.
4. Check: the homepage header shows **My Account**, and `lawnsbytimmy.com/account/` loads the sign-in page.

## Step 5: Test it

1. Make sure your own email is a customer in Stripe.
2. Go to `lawnsbytimmy.com/account`, enter your email, open the link in the email, and tap **Open my account**.
3. Check that you see your card, payments, and property info. Tap **Update card & view receipts**, and send a test request.
4. If you did Step 4b, open the same email link again and tap the button: it should say the link was already used.

---

## Good to know

- **Sign-in links** expire after 15 minutes and (with Step 4b) work once. Customers stay signed in for 30 days on that device.
- **Why the extra "Open my account" button:** email security scanners open links before the customer does. The button means a scanner can't use up the one-time link.
- **Signing out** clears the cookie on that device only. To sign *everyone* out (say, a customer's phone is stolen), change `SESSION_SECRET`.
- **Security:** card numbers never touch your site. Customers only see the last 4 digits, and card changes happen on Stripe's own page. Each customer can only see their own account.
- **Changing `SESSION_SECRET`** signs everyone out (handy if you ever need to).
- **Testing on your own computer:** copy the Step 4 values into a `.dev.vars` file (it's git-ignored) and run `npx wrangler dev`. Add `DEV_SHOW_LOGIN_LINK=true` to show the sign-in link on screen instead of emailing it. **Never set that in Cloudflare.**
