// POST /api/account/verify  { code }
// Checks the 6-digit code against the challenge cookie set by /login, then
// starts the 30-day session. A code works once and only for 10 minutes.
//
// Guessing protection: each visitor gets 5 tries a minute (LOGIN_IP_LIMITER)
// and each code 2 tries a minute (LOGIN_EMAIL_LIMITER), so a code can't be
// guessed before it expires.
//
// GET is what old emailed sign-in links point to; it just opens the sign-in page.
import {
  json,
  verifyToken,
  signToken,
  hmac,
  sameString,
  getCookie,
  cookie,
  sessionCookie,
  sameOrigin,
  clientIp,
  overLimit,
  linkStore,
  CODE_COOKIE,
  SESSION_DAYS,
  PHONE,
  setting,
  settingsProblem,
} from "./lib.js";

export async function onRequestGet({ request }) {
  return new Response(null, {
    status: 303,
    headers: { Location: `${new URL(request.url).origin}/account/`, "Cache-Control": "no-store" },
  });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  const problem = settingsProblem(env, "verify");
  if (problem) return problem;

  if (await overLimit(env.LOGIN_IP_LIMITER, `verify:${clientIp(request)}`)) {
    return json({ error: "Too many tries. Please wait a minute and try again." }, 429);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send JSON" }, 400);
  }
  const code = String(body.code || "").replace(/\D/g, "");
  if (code.length !== 6) return json({ error: "Enter the 6-digit code from the text." }, 400);

  try {
    const challenge = await verifyToken(getCookie(request, CODE_COOKIE), setting(env, "SESSION_SECRET"), "code");
    if (!challenge) return json({ error: "That code expired. Tap “Text me a new code”.", expired: true }, 400);

    if (await overLimit(env.LOGIN_EMAIL_LIMITER, `code:${challenge.n}`)) {
      return json({ error: "Too many tries. Please wait a minute and try again." }, 429);
    }

    const store = linkStore(env);
    if (store && (await store.get(`used:${challenge.n}`))) {
      return json({ error: "That code was already used. Tap “Text me a new code”.", expired: true }, 400);
    }

    const expected = await hmac(setting(env, "SESSION_SECRET"), `${challenge.n}:${code}`);
    if (!challenge.cid || !sameString(expected, challenge.h)) {
      return json({ error: `That code doesn't match. Check the text and try again, or call ${PHONE}.` }, 400);
    }

    if (store) {
      const secondsLeft = Math.ceil((challenge.exp - Date.now()) / 1000);
      await store.put(`used:${challenge.n}`, "1", { expirationTtl: Math.max(60, secondsLeft) });
    }

    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const session = await signToken(
      { p: "session", cid: challenge.cid, phone: challenge.phone, exp: Date.now() + maxAge * 1000 },
      setting(env, "SESSION_SECRET")
    );
    const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
    headers.append("Set-Cookie", sessionCookie(session, maxAge));
    headers.append("Set-Cookie", cookie(CODE_COOKIE, "", 0, "/api/account/"));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error("verify error", err);
    return json({ error: `We couldn't sign you in right now. Please call ${PHONE}.` }, 500);
  }
}
