# Connecting the Quote Form (Webhook Setup)

## What's a "webhook" and why does the form need one?

Think of a webhook as a mailbox address for data. When someone fills out the "Get My Instant Quote" form on your site, the website needs somewhere to *send* that information — the visitor's name, phone, address, and answers. A webhook URL is that address.

Right now, the form is fully built and validates every field, but the address it sends to is just a placeholder (`REPLACE_WITH_YOUR_WEBHOOK_URL`). Until you swap that for a real address, submitted leads only show up in the browser's developer console — they will **not** reach you. This is the one step left to make the form live.

## Step 1: Get a webhook URL

Pick whichever tool you already use (or plan to use) to receive leads:

- **Make.com** (mentioned in your Lawns by Timmy SOP as part of your automation stack):
  1. Create a new Scenario.
  2. Add a "Webhooks" module → "Custom webhook" as the trigger.
  3. Click "Add," name it (e.g. "Lawns by Timmy — Lead Form"), and Make will generate a unique URL for you. Copy it.
  4. From there, chain in whatever should happen next — e.g. add the lead to your CRM, send yourself a text, etc.

- **Zapier**: Create a Zap, choose "Webhooks by Zapier" → "Catch Hook" as the trigger. Zapier gives you a URL the same way.

- **Your CRM directly** (e.g. BusinessLaunchOS), if it offers an "inbound webhook" or "API endpoint" for new leads — check its integrations/settings page.

## Step 2: Paste the URL into the website

1. Open `index.html` in any text editor.
2. Find this line near the bottom of the file (inside the `<script>` section):
   ```js
   const LEAD_WEBHOOK_URL = "REPLACE_WITH_YOUR_WEBHOOK_URL";
   ```
3. Replace the placeholder text with your real webhook URL, in quotes, like:
   ```js
   const LEAD_WEBHOOK_URL = "https://hook.make.com/your-real-address-here";
   ```
4. Save the file and re-publish the site (see the main `README.md` for how, depending on where you're hosting).

## Step 3: Test it

Fill out the form on your live site with a test entry. Then check whichever tool you connected (Make.com's scenario history, Zapier's task history, or your CRM's lead list) to confirm the test entry arrived. If it doesn't show up, double check the URL was pasted in exactly, with no extra spaces.

## What data gets sent

Every submission sends this shape of information (this matches the format your automation stack can expect):

```json
{
  "event": "lead_form_submitted",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "lead_data": {
    "first_name": "",
    "last_name": "",
    "phone": "",
    "email": "",
    "service_address": "",
    "city": "",
    "zip": "",
    "gate_width_inches": 48,
    "pets_secured": true,
    "frequency": "Weekly",
    "add_ons": [],
    "card_on_file_agreed": true
  }
}
```

---

# Connecting the Flow Audit Form (drainage & eco-restoration)

The homepage has a second form, "Book your free Flow Audit" (the `#flow-audit` section). It is for drainage, dry creek bed, rain garden, biochar and backyard homestead leads, so it sends to its **own** Make webhook. It must not use the quote webhook above, because the `LBT_Quote` scenario would email the homeowner a mowing price.

**Status: connected** (Nov 2026) to the Make scenario `LBT_Flow_Audit` via the webhook `LBT_Flow_Audit_Hook`. Each request becomes a "New Lead" row in the CRM sheet (source "Flow Audit Form", issues and best time in the notes column) and an email to info@lawnsbytimmy.com. If the webhook ever fails, the form shows "please call or text us at (954) 880-3500", so no lead disappears silently. The steps below are how to rebuild it if you ever need to.

## Step 1: Create the webhook in Make.com

1. Create a new Scenario named `LBT_Flow_Audit`.
2. Add "Webhooks" → "Custom webhook" as the trigger, click "Add", name it `LBT_Flow_Audit_Hook`, and copy the URL.
3. Add what should happen next, for example:
   - Google Sheets → Add a row to the "Lawns By Timmy CRM" sheet with status "New Lead" and source "Flow Audit Form".
   - Gmail → Send an email to info@lawnsbytimmy.com with the details.
4. Add "Webhooks" → "Webhook response" with status `200` so the website knows it arrived.
5. Turn the scenario on.

## Step 2: Paste the URL into the website

In `index.html`, find:

```js
const AUDIT_WEBHOOK_URL = "REPLACE_WITH_AUDIT_WEBHOOK_URL";
```

and replace the placeholder with the new URL. Save, commit, and push.

## What data gets sent

```json
{
  "event": "flow_audit_requested",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "audit_data": {
    "name": "",
    "phone": "",
    "email": "",
    "address": "",
    "issues": ["Water pools after rain", "Backyard homestead project"],
    "best_time": "Morning",
    "sms_consent": true
  }
}
```
