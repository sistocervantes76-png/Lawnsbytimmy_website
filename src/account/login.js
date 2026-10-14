// POST /api/account/login  { email }
// Emails a one-time sign-in link to customers who have a Stripe account.
// Always answers the same way so nobody can use it to check who is a customer.
//
// Spam protection (so nobody can flood customers' inboxes from info@):
//  - each visitor (IP address) gets 5 tries a minute         -> LOGIN_IP_LIMITER
//  - each email address gets at most 2 link requests a minute -> LOGIN_EMAIL_LIMITER
//  - with the LOGIN_LINKS store set up, one email per address per minute, period
import {
  json,
  normalizeEmail,
  sameOrigin,
  signToken,
  findStripeCustomer,
  sendToMake,
  clientIp,
  overLimit,
  linkStore,
  LOGIN_LINK_MINUTES,
  PHONE,
} from "./lib.js";

const EMAIL_COOLDOWN_SECONDS = 60; // KV's shortest allowed expiry

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);

  if (await overLimit(env.LOGIN_IP_LIMITER, `ip:${clientIp(request)}`)) {
    return json({ error: `Too many tries. Please wait a minute and try again, or call ${PHONE}.` }, 429);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send JSON" }, 400);
  }
  const email = normalizeEmail(body.email);
  if (!email) return json({ error: "Please enter a valid email address." }, 400);

  const genericReply = json({
    ok: true,
    message: "If that email is on a Lawns by Timmy account, a sign-in link is on its way.",
  });

  // Same friendly answer when an address is being hammered: the real customer
  // already has a fresh link in their inbox, and an attacker learns nothing.
  if (await overLimit(env.LOGIN_EMAIL_LIMITER, `email:${email}`)) return genericReply;
  const store = linkStore(env);
  if (store && (await store.get(`cooldown:${email}`))) return genericReply;

  try {
    const customer = await findStripeCustomer(env, email);
    if (!customer) return genericReply;

    const token = await signToken(
      {
        p: "login",
        email,
        cid: customer.id,
        n: crypto.randomUUID(), // lets the link be used only once
        exp: Date.now() + LOGIN_LINK_MINUTES * 60 * 1000,
      },
      env.SESSION_SECRET
    );
    const origin = new URL(request.url).origin;
    const loginUrl = `${origin}/api/account/verify?t=${encodeURIComponent(token)}`;

    await sendToMake(env, "account_login_link", {
      email,
      first_name: (customer.name || "").split(" ")[0] || "",
      login_url: loginUrl,
      expires_minutes: LOGIN_LINK_MINUTES,
    });

    if (store) await store.put(`cooldown:${email}`, "1", { expirationTtl: EMAIL_COOLDOWN_SECONDS });

    // Local testing only: lets you sign in without an email being sent.
    if (env.DEV_SHOW_LOGIN_LINK === "true") {
      return json({ ok: true, message: "Dev mode: use the link below.", dev_login_url: loginUrl });
    }
    return genericReply;
  } catch (err) {
    console.error("login error", err);
    return json({ error: `We couldn't send a sign-in link right now. Please call ${PHONE}.` }, 500);
  }
}
