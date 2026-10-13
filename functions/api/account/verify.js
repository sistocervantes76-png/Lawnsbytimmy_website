// GET /api/account/verify?t=...  — the link in the sign-in email.
// Swaps a valid login link for a 30-day session cookie, then opens the dashboard.
import { verifyToken, signToken, sessionCookie, SESSION_DAYS } from "../../_lib/account.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const login = await verifyToken(url.searchParams.get("t"), env.SESSION_SECRET, "login");
  if (!login) {
    return Response.redirect(`${url.origin}/account/?error=expired`, 302);
  }

  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const session = await signToken(
    { p: "session", email: login.email, cid: login.cid, exp: Date.now() + maxAge * 1000 },
    env.SESSION_SECRET
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/account/",
      "Set-Cookie": sessionCookie(session, maxAge),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
