# Lawns by Timmy — Website

This is the marketing website for **lawnsbytimmy.com**, a lawn mowing service serving Oakland Park & Fort Lauderdale, FL.

It is one self-contained file — `index.html` — with all the design (CSS) and interactive form logic (JavaScript) built right in. There is no build step, no server, and nothing to install. That makes it easy to preview, edit, and host anywhere.

- **Business phone (shown on the site):** (954) 880-3500
- **Email (shown on the site):** info@lawnsbytimmy.com
- **Service area:** Oakland Park & Fort Lauderdale, FL

## Lead form status: connected

The "Get My Instant Quote" form is fully wired up to Timmy's Make.com automation. Every submission is sent there instantly. See `docs/webhook-setup.md` if you ever need to change where it points (e.g. you rebuild the Make scenario and get a new address).

## Customer accounts (lawnsbytimmy.com/account)

Customers sign in with their cell number and a 6-digit code texted from (954) 880-3500. They see their next visit, property details, balance, bills, recent visits, and can send requests (skip a visit, extra service, etc.). Everything comes from the "Lawns By Timmy CRM" sheet through the Make scenario `LBT_Customer_Account`. The behind-the-scenes code lives in `src/` and runs as the `lawnsbytimmy-website` Cloudflare Worker (configured in `wrangler.jsonc`). **Setup and secrets:** see `docs/customer-dashboard-setup.md`.

## Previewing the site on your own computer

You don't need to install anything. Just double-click `index.html` and it will open in your web browser. That's the whole site, exactly as a visitor would see it.

## Publishing it live at lawnsbytimmy.com

Any of these will work. All three are free to start and let you point your `lawnsbytimmy.com` domain at the site once it's live.

1. **Cloudflare Pages** (recommended — same platform your Fork Algorithm tools already use)
   - Go to the Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repository.
   - Build settings: none needed (no build command, output directory is the repo root).
   - After it deploys, go to Custom Domains and add `lawnsbytimmy.com`.

2. **Netlify**
   - Drag the whole project folder onto [app.netlify.com/drop](https://app.netlify.com/drop) for an instant preview link, or connect this GitHub repo for automatic updates every time you push a change.

3. **GitHub Pages**
   - In this repo's Settings → Pages, set the source to the `main` branch, root folder. GitHub will give you a live URL, then you can point your domain at it.

## Making changes later

Everything you'd want to edit — headline text, phone number, colors, FAQ answers — is inside `index.html`. Open it in any text editor, make your change, save, and re-publish using whichever method above you chose.

## Where this site is hosted

- **Live site:** Cloudflare. The domain (lawnsbytimmy.com) and its DNS are on Cloudflare, and the site runs as the `lawnsbytimmy-website` Cloudflare Worker.
- **Code:** this GitHub repo.
- **Not used: Vercel.** An old Vercel project called `lawns-by-timmy` (started in Vercel's v0 builder on Sep 13, 2026) also had lawnsbytimmy.com and www.lawnsbytimmy.com attached. Because the domain points to Cloudflare, Vercel kept sending "2 domains need configuration" emails. That Vercel project was deleted on Oct 18, 2026.
- If Vercel emails like that ever show up again, they are not about the live site. Don't add the domain back in Vercel.
