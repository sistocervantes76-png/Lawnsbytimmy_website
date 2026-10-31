// GET /api/account/health
// Shows whether the Cloudflare settings the account area needs are in place.
// It only says "ok" / "missing" for each name. It never shows any value.
import { json, settingsStatus, linkStore } from "./lib.js";

export async function onRequestGet({ env }) {
  const settings = settingsStatus(env);
  const ready = Object.values(settings).every((v) => v === "ok");
  return json({
    ready,
    settings,
    one_time_codes_store: linkStore(env) ? "on" : "off (optional)",
    fix: ready
      ? "All set."
      : "Cloudflare > Workers & Pages > lawnsbytimmy-website > Settings > Variables and Secrets: add each name marked missing, then redeploy.",
  });
}
