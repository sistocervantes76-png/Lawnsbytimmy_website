// Cloudflare Worker entry point for lawnsbytimmy.com.
// /api/account/* runs the customer account code; everything else is the
// regular static site (index.html, /account/, etc.), served as before.
import * as login from "./account/login.js";
import * as verify from "./account/verify.js";
import * as logout from "./account/logout.js";
import * as me from "./account/me.js";
import * as request from "./account/request.js";
import { json } from "./account/lib.js";

const routes = {
  "/api/account/login": login,
  "/api/account/verify": verify,
  "/api/account/logout": logout,
  "/api/account/me": me,
  "/api/account/request": request,
};

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const route = routes[url.pathname.replace(/\/$/, "")];
    if (!route) {
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(req);
    }
    const method = req.method.charAt(0) + req.method.slice(1).toLowerCase(); // GET -> Get
    const handler = route[`onRequest${method}`];
    if (!handler) return json({ error: "Method not allowed" }, 405);
    return handler({ request: req, env, ctx });
  },
};
