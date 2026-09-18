# Lawns by Timmy — Website

This is the marketing website for **lawnsbytimmy.com**, a lawn mowing service serving Oakland Park & Fort Lauderdale, FL.

It is one self-contained file — `index.html` — with all the design (CSS) and interactive form logic (JavaScript) built right in. There is no build step, no server, and nothing to install. That makes it easy to preview, edit, and host anywhere.

- **Business phone (shown on the site):** (954) 880-3500
- **Email (shown on the site):** info@lawnsbytimmy.com
- **Service area:** Oakland Park & Fort Lauderdale, FL

## Before this site can send you real leads

The "Get My Instant Quote" form is fully built, but it needs one piece of setup before it will actually deliver leads to you: a **webhook URL**. See `docs/webhook-setup.md` for a plain-English walkthrough — it takes about 5 minutes.

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
