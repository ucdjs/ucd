import type { Context } from "hono";
import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { badRequest, internalServerError, notFound } from "@ucdjs/worker-shared";
import { createMiddleware } from "hono/factory";
import { UNICODE_PROXY_STAT_WILDCARD_ROUTE, UNICODE_PROXY_WILDCARD_ROUTE } from "./v1_unicode-proxy.openapi";

export const V1_UNICODE_PROXY_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-proxy");

// A hack for OpenAPI not supporting splat routes
// So we register the path with a normal parameter named "wildcard",
// And then adds a normal route handler that matches any path using the wildcard parameter.
// This allows us to still describe the route in OpenAPI,
// while also allowing the actual route to match any path.

V1_UNICODE_PROXY_ROUTER.openAPIRegistry.registerPath(UNICODE_PROXY_WILDCARD_ROUTE);
V1_UNICODE_PROXY_ROUTER.openAPIRegistry.registerPath(UNICODE_PROXY_STAT_WILDCARD_ROUTE);

/**
 * @internal
 */
async function internalProxyRoute(c: Context) {
  try {
    const path = c.req.param("wildcard")?.trim() || "";

    if (path.startsWith("..") || path.includes("//")) {
      return badRequest({
        message: "Invalid path: Path cannot contain '..' or '//' segments.",
      });
    }
    const url = path !== "" ? `${c.env.PROXY_ENDPOINT}/${path}` : c.env.PROXY_ENDPOINT;
    let res: Response;
    if (c.env.USE_SVC_BINDING) {
      const req = new Request(url);
      res = await c.env.UNICODE_PROXY.fetch(req);
    } else {
      res = await fetch(url);
    }

    if (!res.ok) {
      if (res.status === 404) {
        return notFound({
          message: `Resource not found at ${path}`,
        });
      }
      return internalServerError({
        message: `Proxy request failed with reason: ${res.statusText}`,
      });
    }

    return c.newResponse(res.body, 200, {
      "Content-Type": res.headers.get("content-type") || "application/octet-stream",
      "Content-Length": res.headers.get("content-length") || "",
      "Cache-Control": "public, max-age=3600",
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return internalServerError({
      message: `Failed to proxy request: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

V1_UNICODE_PROXY_ROUTER.get("/:wildcard{.*}?", async (c) => {
  return internalProxyRoute(c);
});

V1_UNICODE_PROXY_ROUTER.get("/__stat/:wildcard{.*}?", async (c) => {
  return internalProxyRoute(c);
});
