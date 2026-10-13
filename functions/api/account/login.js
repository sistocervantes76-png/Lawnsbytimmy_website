// POST /api/account/login  { email }
// Emails a one-time sign-in link to customers who have a Stripe account.
// Always answers the same way so nobody can use it to check who is a customer.
import {
  json,
  normalizeEmail,
  sameOrigin,
  signToken,
  findStripeCustomer,
  sendToMake,
  LOGIN_LINK_MINUTES,
} from "../../_lib/account.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);

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

  try {
    const customer = await findStripeCustomer(env, email);
    if (!customer) return genericReply;

    const token = await signToken(
      { p: "login", email, cid: customer.id, exp: Date.now() + LOGIN_LINK_MINUTES * 60 * 1000 },
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

    // Local testing only: lets you sign in without an email being sent.
    if (env.DEV_SHOW_LOGIN_LINK === "true") {
      return json({ ok: true, message: "Dev mode: use the link below.", dev_login_url: loginUrl });
    }
    return genericReply;
  } catch (err) {
    console.error("login error", err);
    return json({ error: "We couldn't send a sign-in link right now. Please call (954) 880-3500." }, 500);
  }
}
