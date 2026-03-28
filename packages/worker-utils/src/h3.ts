import type { H3, H3Event } from "h3";
import { createDebugger } from "@ucdjs-internal/shared";
import { handleCors, HTTPError } from "h3";
import { getOriginsForEnvironment } from "./environment";
import { customError, internalServerError } from "./errors";

const debug = createDebugger("ucdjs:api");

export function getCloudflareEnv<TEnv extends Cloudflare.Env = Cloudflare.Env>(event: H3Event): TEnv {
  const env = event.runtime?.cloudflare?.env;
  if (!env) {
    throw new Error("Cloudflare env is not available for this request.");
  }

  return env as TEnv;
}

export function setupH3Cors(app: H3): void {
  app.use("/**", (event) => {
    const env = getCloudflareEnv<Partial<Cloudflare.Env> & { ENVIRONMENT?: string }>(event);
    const response = handleCors(event, {
      allowHeaders: ["Content-Type"],
      methods: ["POST", "HEAD", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: "600",
      credentials: true,
      origin(origin) {
        const environment = env.ENVIRONMENT || "prod";
        const allowedOrigins = getOriginsForEnvironment(environment);
        return allowedOrigins.includes(origin || "");
      },
    });

    return response || undefined;
  });
}

export function setupH3Ratelimit(app: H3): void {
  app.use("/**", async (event) => {
    const env = getCloudflareEnv<Cloudflare.Env & { RATE_LIMITER?: RateLimit }>(event);
    const key
      = event.req.headers.get("cf-connecting-ip")
        ?? event.req.headers.get("x-forwarded-for")
        ?? "unknown-ip";

    if (!env.RATE_LIMITER) {
      throw new Error("RATE_LIMITER is not defined in your environment. Please check your worker bindings.");
    }

    const { success } = await env.RATE_LIMITER.limit({ key });
    if (!success) {
      return customError({
        status: 429,
        message: "Too Many Requests - Please try again later",
      });
    }

    return undefined;
  });
}

export function h3ErrorHandler(error: HTTPError, event: H3Event): Response {
  debug?.("Error processing request", { path: event.url.pathname + event.url.search, error });
  if (HTTPError.isError(error)) {
    return customError({
      status: error.status,
      message: error.message,
    });
  }

  return internalServerError();
}
