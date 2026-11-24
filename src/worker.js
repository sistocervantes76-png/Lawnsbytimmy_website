// Cloudflare Worker entry point for lawnsbytimmy.com.
// /api/account/* runs the customer account code. The Stripe test webhook
// lives at /api/stripe/lbt-webhook. Booking routes answer 404 until this
// Worker's role, mode, and matching Stripe keys are all set.
// Everything else is the regular static site, served as before.
import * as login from "./account/login.js";
import * as verify from "./account/verify.js";
import * as logout from "./account/logout.js";
import * as me from "./account/me.js";
import * as request from "./account/request.js";
import * as card from "./account/card.js";
import * as stripeWebhook from "./stripe-webhook.js";
import * as booking from "./booking/handlers.js";
import * as bookingWebhook from "./booking/webhook.js";
import { bookingMode } from "./booking/guard.js";
import { json } from "./account/lib.js";

export { SlotLedger } from "./booking/ledger.js";

const routes = {
  "/api/account/login": login,
  "/api/account/verify": verify,
  "/api/account/logout": logout,
  "/api/account/me": me,
  "/api/account/request": request,
  "/api/account/card/setup": card.setup,
  "/api/account/card/confirm": card.confirm,
  "/api/account/card/remove": card.remove,
  "/api/stripe/lbt-webhook": stripeWebhook,
  "/api/book/config": booking.config,
  "/api/book/quote": booking.quote,
  "/api/book/slots": booking.slots,
  "/api/book/hold": booking.hold,
  "/api/book/update": booking.update,
  "/api/book/status": booking.status,
  "/api/book/snapshot": booking.snapshot,
  "/api/stripe/booking-webhook": bookingWebhook,
};

const bookingPaths = new Set([
  "/api/book/config",
  "/api/book/quote",
  "/api/book/slots",
  "/api/book/hold",
  "/api/book/update",
  "/api/book/status",
  "/api/book/snapshot",
  "/api/stripe/booking-webhook",
]);

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/$/, "");
    if (bookingPaths.has(path) && bookingMode(env) === "off") return json({ error: "Not found" }, 404);
    const route = routes[path];
    if (!route) {
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      // A Worker deployed without the site files has no ASSETS binding. Don't crash.
      if (typeof env?.ASSETS?.fetch !== "function") return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(req);
    }
    const method = req.method.charAt(0) + req.method.slice(1).toLowerCase(); // GET -> Get
    const handler = route[`onRequest${method}`];
    if (!handler) return json({ error: "Method not allowed" }, 405);
    return handler({ request: req, env, ctx });
  },
};
