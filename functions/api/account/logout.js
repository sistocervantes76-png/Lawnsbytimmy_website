// POST /api/account/logout — clears the session cookie.
import { json, sessionCookie } from "../../_lib/account.js";

export async function onRequestPost() {
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}
