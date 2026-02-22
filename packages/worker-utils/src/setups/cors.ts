import type { Env, Hono } from "hono";
import { cors } from "hono/cors";
import { getOriginsForEnvironment } from "../environment";

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
export function setupCors<TEnv extends Env>(app: Hono<TEnv>): void {
  app.use("/*", cors({
    allowHeaders: ["Content-Type"],
    allowMethods: ["POST", "HEAD", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
    origin(origin, c) {
      const env = c.env.ENVIRONMENT || "prod";
      if (env == null) {
        console.warn("[CORS] ENVIRONMENT variable is not set. Defaulting to empty allowed origins.");
        return "";
      }

      const allowedOrigins = getOriginsForEnvironment(env);
      if (allowedOrigins.includes(origin || "")) {
        return origin || "";
      }

      return "";
    },
  }));
}
