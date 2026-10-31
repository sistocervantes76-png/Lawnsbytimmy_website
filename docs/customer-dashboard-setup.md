# Customer Dashboard (lawnsbytimmy.com/account): Setup

Customers go to **lawnsbytimmy.com/account** (or click **My Account** in the site header), type their cell number, and get a 6-digit code by text from (954) 880-3500. No passwords, no email, no card needed. Once they're in, they see:

- **Next visit:** the date from the CRM's Next_Service_Date, plus their schedule and services
- **Their property:** address and gate/pet/access notes, from the CRM
- **Balance:** what they owe right now and how to pay (cash or Apple Pay, plus Zelle when their Payment_Method in the CRM says Zelle)
- **Their bills:** the last 12 rows from the Invoices tab, marked Paid or Due
- **Recent visits:** the last 6 completed jobs from the Jobs tab
- **Need something?:** skip a visit, request an extra service, update access notes, or something else. The request lands on the CRM's Account Requests tab and emails info@lawnsbytimmy.com.

Only real customers can sign in: a row on the Customers tab with an ID like `LC-0001` and their cell number in the Phone column. Missed-call leads and test rows can't.

---

## How it works (in plain words)

| Piece | Where it lives | What it does |
|---|---|---|
| `account/index.html` | Your site | The sign-in and dashboard page customers see |
| `src/` + `wrangler.jsonc` | Cloudflare Worker `lawnsbytimmy-website` (deploys automatically from GitHub) | Matches the phone to the CRM, makes and checks the code, builds the dashboard |
| Make scenario `LBT_Customer_Account` | Make.com | Reads the CRM for the Worker (`crm_snapshot`), texts the code through RingCentral (`send_code`), logs requests (`service_request`) |
| "Lawns By Timmy CRM" | Google Sheets | The source of truth: Customers, Invoices, Jobs, Account Requests |

The Make scenario only answers calls that carry the shared key, so nobody who finds the webhook address can read the CRM.

---

## Step 1: Settings in Cloudflare

Cloudflare dashboard → **Workers & Pages** → **lawnsbytimmy-website** → **Settings** → **Variables and Secrets** → **Add**. Pick type **Secret** for each. They stay hidden and survive every deploy.

| Name | Value |
|---|---|
| `SESSION_SECRET` | A long random string, at least 32 characters. Generate one at any password generator and **never share it**. |
| `ACCOUNT_WEBHOOK_URL` | `https://hook.us2.make.com/oyic7ulfo2i8npn7i7xwvefvjqzbfmkb` |
| `ACCOUNT_WEBHOOK_KEY` | The shared key. It must match the key in the three filters of the Make scenario. |

`STRIPE_SECRET_KEY` is no longer used; you can delete it.

**Common mix-ups (each one stops sign-in before it ever reaches Make):**
- Adding them under **Settings → Build → Variables** instead. Build variables are only used while building; the running site can't see them.
- Adding them to a different project (for example an old Cloudflare **Pages** project) instead of the **lawnsbytimmy-website** Worker that serves the domain.
- A typo or different capitalization in the name. The names must match the table exactly.

**Check it:** open `lawnsbytimmy.com/api/account/health`. Every setting should say `"ok"`. It only shows ok/missing, never the values. If something is missing, sign-in returns "isn't available right now" and the Worker's **Logs** tab shows exactly which name is missing.

## Step 2: Make sure the site is served by the Worker

1. Open the **lawnsbytimmy-website** Worker → **Settings** → **Domains & Routes**. `lawnsbytimmy.com` (and `www.lawnsbytimmy.com` if you use it) should be listed as a **Custom domain**. If not: **Add** → **Custom domain**.
2. Same Worker → **Settings** → **Build**: connected to this GitHub repo on the `main` branch, so every merge deploys.
3. Check: the homepage header shows **My Account**, and `lawnsbytimmy.com/account/` loads the sign-in page.

## Step 3 (optional): Make codes one-time-use

Without this step sign-in still works, and a code still expires after 10 minutes.

1. Cloudflare dashboard → **Storage & Databases** → **Workers KV** → **Create instance**. Name it `lawnsbytimmy-login-links`.
2. Copy its **ID**.
3. In `wrangler.jsonc`, turn on the `kv_namespaces` block at the bottom and paste the ID there (the file says exactly what to change). Commit to `main` and it redeploys.

Spam protection needs no setup: 5 tries a minute per visitor, at most 2 code texts a minute per number (1 a minute once Step 3 is done), and 2 guesses a minute per code.

## Step 4: Test it

1. Go to `lawnsbytimmy.com/account`, enter a customer's cell number (yours works if you add yourself as a customer row), and check that the text arrives.
2. Enter the code. You should see the next visit, property, balance, bills and visits.
3. Send a test request and check the Account Requests tab and the info@ inbox.

---

## Good to know

- **Customers stay signed in for 30 days** on that device. Signing out clears it on that device only. To sign *everyone* out (say, a customer's phone is stolen), change `SESSION_SECRET`.
- **Changing a customer's phone in the CRM** signs out their old number, because every visit to the dashboard checks the number still matches.
- **No customer data is stored on the website.** Every visit reads the CRM fresh through Make.
- **Testing on your own computer:** copy the Step 1 values into a `.dev.vars` file (it's git-ignored) and run `npx wrangler dev`.
