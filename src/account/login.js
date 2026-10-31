// POST /api/account/login  { phone }
// Texts a 6-digit sign-in code to customers whose phone number is in the CRM.
// Always answers the same way so nobody can use it to check who is a customer.
//
// Spam protection (so nobody can run up texts from (954) 880-3500):
//  - each visitor (IP address) gets 5 tries a minute          -> LOGIN_IP_LIMITER
//  - each phone number gets at most 2 code requests a minute  -> LOGIN_EMAIL_LIMITER
//  - with the LOGIN_LINKS store set up, one text per number per minute, period
import {
  json,
  normalizePhone,
  sameOrigin,
  signToken,
  hmac,
  cookie,
  readCrm,
  findCustomers,
  sendToMake,
  clientIp,
  overLimit,
  linkStore,
  CODE_COOKIE,
  CODE_MINUTES,
  PHONE,
  setting,
  settingsProblem,
} from "./lib.js";

const PHONE_COOLDOWN_SECONDS = 60; // KV's shortest allowed expiry

function sixDigits() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, "0");
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  const problem = settingsProblem(env, "login");
  if (problem) return problem;

  if (await overLimit(env.LOGIN_IP_LIMITER, `ip:${clientIp(request)}`)) {
    return json({ error: `Too many tries. Please wait a minute and try again, or call ${PHONE}.` }, 429);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send JSON" }, 400);
  }
  const phone = normalizePhone(body.phone);
  if (!phone) return json({ error: "Please enter your 10-digit cell number." }, 400);

  const reply = async (cid, code) => {
    // Every answer sets a challenge cookie, real or not, so the reply looks the same either way.
    const n = crypto.randomUUID();
    const token = await signToken(
      {
        p: "code",
        phone,
        cid: cid || "",
        n,
        h: await hmac(setting(env, "SESSION_SECRET"), `${n}:${code || crypto.randomUUID()}`),
        exp: Date.now() + CODE_MINUTES * 60 * 1000,
      },
      setting(env, "SESSION_SECRET")
    );
    return json(
      { ok: true, message: `If that number is on a Lawns by Timmy account, we just texted it a 6-digit code.` },
      200,
      { "Set-Cookie": cookie(CODE_COOKIE, token, CODE_MINUTES * 60, "/api/account/") }
    );
  };

  try {
    if (await overLimit(env.LOGIN_EMAIL_LIMITER, `phone:${phone}`)) return reply();
    const store = linkStore(env);
    if (store && (await store.get(`cooldown:${phone}`))) return reply();

    const crm = await readCrm(env);
    const [customer] = findCustomers(crm, (c) => normalizePhone(c.Phone) === phone);
    if (!customer) return reply();

    const code = sixDigits();
    await sendToMake(env, "send_code", {
      phone: `+1${phone}`,
      code,
      first_name: customer.First_Name || "",
      customer_id: customer.Customer_ID,
    });
    if (store) await store.put(`cooldown:${phone}`, "1", { expirationTtl: PHONE_COOLDOWN_SECONDS });
    return reply(customer.Customer_ID, code);
  } catch (err) {
    console.error("login error", err);
    return json({ error: `We couldn't text a code right now. Please call ${PHONE}.` }, 500);
  }
}
