// POST /api/account/request  { type, date?, message? }
// Sends a customer request (skip a visit, extra service, update access notes, other)
// to the Make.com scenario, which logs it to the CRM and notifies Timmy.
import { json, getSession, sameOrigin, sendToMake } from "./lib.js";

const TYPES = {
  skip_visit: "Skip a visit",
  extra_service: "Request an extra service",
  update_access: "Update gate / pet / access notes",
  other: "Something else",
};

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  const session = await getSession(request, env);
  if (!session) return json({ signed_in: false }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send JSON" }, 400);
  }

  const type = String(body.type || "");
  if (!TYPES[type]) return json({ error: "Please choose what you need." }, 400);
  const message = String(body.message || "").trim().slice(0, 1000);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ? body.date : "";
  if (type !== "skip_visit" && !message) return json({ error: "Please add a short note." }, 400);
  if (type === "skip_visit" && !date) return json({ error: "Please pick the date to skip." }, 400);

  if (!env.ACCOUNT_WEBHOOK_URL) {
    return json({ error: "Requests aren't switched on yet. Please call (954) 880-3500." }, 503);
  }

  try {
    await sendToMake(env, "service_request", {
      email: session.email,
      stripe_customer_id: session.cid,
      request_type: type,
      request_label: TYPES[type],
      date,
      message,
    });
    return json({ ok: true, message: "Got it. We'll confirm by text or email." });
  } catch (err) {
    console.error("request error", err);
    return json({ error: "That didn't go through. Please call (954) 880-3500." }, 500);
  }
}
