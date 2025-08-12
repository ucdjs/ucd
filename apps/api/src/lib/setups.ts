import type { Env, Hono } from "hono";
import type { HonoEnv } from "../types";
import { customError } from "./errors";

/**
 * Sets up Cross-Origin Resource Sharing (CORS) middleware for a Hono application.
 *
 * Configures CORS headers based on the environment and allowed origins list.
 * Different origins are permitted based on the ENVIRONMENT binding:
 * - Production: Only allows official ucdjs.dev domains
 * - Local: Additionally allows localhost development servers
 * - Preview: Additionally allows preview environment domains
 *
 * @template {object} TEnv - The environment type for Hono context bindings
 * @param {Hono<TEnv>} app - The Hono application instance to configure CORS middleware for
 *
 * @example
 * ```typescript
 * import { Hono } from "hono";
 * import { setupCors } from "../../lib";
 *
 * const app = new Hono();
 * setupCors(app);
 * ```
 */
export function setupCors(app: Hono<HonoEnv>): void {
  app.use("*", (c, next) => {
    const env = c.env.ENVIRONMENT || "";
    const allowedOrigins = ["https://ucdjs.dev", "https://www.ucdjs.dev"];

    if (env === "local") {
      allowedOrigins.push("http://localhost:3000", "http://localhost:8787");
    }

    if (env === "preview") {
      allowedOrigins.push("https://preview.api.ucdjs.dev", "https://preview.unicode-proxy.ucdjs.dev");
    }

    const origin = c.req.header("origin");
    if (allowedOrigins.includes(origin || "")) {
      c.res.headers.set("Access-Control-Allow-Origin", origin || "");
      c.res.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST");
      c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
      c.res.headers.set("Access-Control-Allow-Credentials", "true");
    } else {
      c.res.headers.set("Access-Control-Allow-Origin", "");
    }

    return next();
  });
}

/**
 * Sets up rate limiting middleware for a Hono application.
 *
 * Implements rate limiting based on client IP address using Cloudflare's rate limiter.
 * The middleware extracts the client IP from various headers (cf-connecting-ip, x-forwarded-for)
 * and falls back to a random UUID if no IP is available. Requests that exceed the rate limit
 * receive a 429 "Too Many Requests" response.
 *
 * @template {object} TEnv - The environment type for Hono context bindings
 * @param {Hono<TEnv>} app - The Hono application instance to configure rate limiting middleware for
 *
 * @throws {HTTPException} Throws 500 error if RATE_LIMITER is not configured in the environment
 * @throws {HTTPException} Throws 429 error when rate limit is exceeded
 *
 * @example
 * ```typescript
 * import { Hono } from "hono";
 * import { setupRatelimit } from "../../lib";
 *
 * const app = new Hono();
 * setupRatelimit(app);
 * ```
 *
 * @remarks
 * Requires RATE_LIMITER binding to be configured in the Cloudflare Worker environment.
 * The rate limiting rules are defined in the Cloudflare dashboard or wrangler.toml configuration.
 */
export function setupRatelimit<TEnv extends Env & { Bindings: { RATE_LIMITER: RateLimit } }>(
  app: Hono<TEnv>,
): void {
  app.use("*", async (c, next) => {
    const key
      = c.req.header("cf-connecting-ip")
        ?? c.req.raw.headers.get("x-forwarded-for")
        ?? "unknown-ip"; // shared fallback key for anonymous requests

    if (c.env == null || !("RATE_LIMITER" in c.env)) {
      throw new Error("RATE_LIMITER is not defined in your environment. Please check your worker bindings.");
    }

    const { success } = await c.env.RATE_LIMITER.limit({ key });

    if (!success) {
      return customError(c, {
        status: 429,
        message: "Too Many Requests - Please try again later",
      });
    }

    await next();
  });
}
