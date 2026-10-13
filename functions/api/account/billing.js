// POST /api/account/billing — opens Stripe's secure billing page for this customer
// (update card, view and download receipts). No second login needed.
import { json, getSession, sameOrigin, stripe } from "../../_lib/account.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  const session = await getSession(request, env);
  if (!session) return json({ signed_in: false }, 401);

  try {
    const portal = await stripe(env, "POST", "/v1/billing_portal/sessions", {
      customer: session.cid,
      return_url: `${new URL(request.url).origin}/account/`,
    });
    return json({ url: portal.url });
  } catch (err) {
    console.error("billing portal error", err);
    return json({ error: "Billing page is unavailable right now. Please call (954) 880-3500." }, 500);
  }
}
