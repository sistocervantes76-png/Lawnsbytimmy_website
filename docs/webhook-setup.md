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
