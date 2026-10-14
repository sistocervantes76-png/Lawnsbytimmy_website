// The link in the sign-in email: /api/account/verify?t=...
//
// GET  shows a small "Finish signing in" page with one button. It does NOT sign
//      anyone in. Email security scanners (Outlook, Gmail, work filters) open
//      links before the customer does; if opening the link signed you in, the
//      scanner would use up the one-time link.
// POST (the button) checks the link, marks it used, sets the 30-day session
//      cookie, and opens the dashboard. A used link never works again.
import { verifyToken, signToken, sessionCookie, sameOrigin, linkStore, SESSION_DAYS, PHONE } from "./lib.js";

function backToSignIn(origin, reason) {
  return new Response(null, {
    status: 303,
    headers: { Location: `${origin}/account/?error=${reason}`, "Cache-Control": "no-store" },
  });
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function confirmPage(token) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Sign in | Lawns by Timmy</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #F5F7F5; color: #1A1A1A; line-height: 1.55; }
  .card { background: #FFFFFF; border: 1px solid #E0E4E0; border-radius: 12px; padding: 32px 28px;
    max-width: 380px; width: 100%; text-align: center; }
  .logo { font-size: 1.2rem; font-weight: 800; margin: 0 0 18px; }
  h1 { font-size: 1.3rem; margin: 0 0 8px; }
  p { margin: 0 0 22px; color: #5b625b; }
  button { width: 100%; padding: 14px 20px; border: none; border-radius: 8px; background: #2E7D32; color: #FFFFFF;
    font: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; }
  button:hover { background: #1f5723; }
  .note { font-size: 0.85rem; margin: 18px 0 0; }
  a { color: #2E7D32; }
</style>
</head>
<body>
  <main class="card">
    <div class="logo">Lawns by Timmy 🌿</div>
    <h1>Finish signing in</h1>
    <p>Tap the button to open your account.</p>
    <form method="post" action="/api/account/verify">
      <input type="hidden" name="t" value="${escapeHtml(token)}">
      <button type="submit">Open my account</button>
    </form>
    <p class="note">Didn't ask for this? You can close this page. Questions? Call <a href="tel:+19548803500">${PHONE}</a>.</p>
  </main>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const login = await verifyToken(token, env.SESSION_SECRET, "login");
  if (!login) return backToSignIn(url.origin, "expired");

  const store = linkStore(env);
  if (store && login.n && (await store.get(`used:${login.n}`))) return backToSignIn(url.origin, "used");

  return confirmPage(token);
}

export async function onRequestPost({ request, env }) {
  const origin = new URL(request.url).origin;
  if (!sameOrigin(request)) return backToSignIn(origin, "expired");

  let token = null;
  try {
    token = (await request.formData()).get("t");
  } catch {
    return backToSignIn(origin, "expired");
  }
  const login = await verifyToken(token, env.SESSION_SECRET, "login");
  if (!login) return backToSignIn(origin, "expired");

  // One-time use. (Cloudflare's store can take a few seconds to sync between
  // its data centers, so two taps in the same instant could both get through,
  // but a link that was used minutes ago, or forwarded later, is dead.)
  const store = linkStore(env);
  if (store) {
    if (!login.n) return backToSignIn(origin, "expired"); // links from before this update
    const usedKey = `used:${login.n}`;
    if (await store.get(usedKey)) return backToSignIn(origin, "used");
    const secondsLeft = Math.ceil((login.exp - Date.now()) / 1000);
    await store.put(usedKey, "1", { expirationTtl: Math.max(60, secondsLeft) });
  }

  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const session = await signToken(
    { p: "session", email: login.email, cid: login.cid, exp: Date.now() + maxAge * 1000 },
    env.SESSION_SECRET
  );

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/account/",
      "Set-Cookie": sessionCookie(session, maxAge),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
