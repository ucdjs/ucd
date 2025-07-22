import type { Context } from "hono";
import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { badRequest, internalServerError, notFound } from "@ucdjs/worker-shared";
import { cache } from "hono/cache";
import { RAW_STAT_WILDCARD_ROUTE, RAW_WILDCARD_ROUTE } from "./v1_raw.openapi";

export const V1_RAW_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/raw");

// A hack for OpenAPI not supporting splat routes
// So we register the path with a normal parameter named "wildcard",
// and then by adding a normal route handler that matches any path using the wildcard parameter.
// This allows us to still describe the route in OpenAPI,
// while also allowing the actual route to match any path.

V1_RAW_ROUTER.openAPIRegistry.registerPath(RAW_WILDCARD_ROUTE);
V1_RAW_ROUTER.openAPIRegistry.registerPath(RAW_STAT_WILDCARD_ROUTE);

/**
 * @internal
 */
async function internalProxyRoute(c: Context<HonoEnv>, extraPath: string = ""): Promise<Response> {
  try {
    const path = c.req.param("wildcard")?.trim() || "";

    if (path.startsWith("..") || path.includes("//")) {
      return badRequest(c, {
        message: "Invalid path: Path cannot contain '..' or '//' segments.",
      });
    }
    const url = path !== "" ? `${c.env.PROXY_ENDPOINT}/${extraPath}${path}` : c.env.PROXY_ENDPOINT;
    let res: Response;
    if (c.env.USE_SVC_BINDING === "true") {
      const req = new Request(url);
      res = await c.env.UNICODE_PROXY.fetch(req);
    } else {
      res = await fetch(url);
    }

    if (!res.ok) {
      if (res.status === 404) {
        return notFound(c, {
          message: "Resource not found",
        });
      }

      return internalServerError(c, {
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
    return internalServerError(c, {
      message: `Failed to proxy request: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

V1_RAW_ROUTER.get("/__stat/:wildcard{.*}?", cache({
  cacheName: "ucdjs:v1_unicode-proxy:wildcard:stat",
  cacheControl: "max-age=3600", // 1 hour
}), async (c) => {
  return internalProxyRoute(c, "__stat/");
});

V1_RAW_ROUTER.get("/:wildcard{.*}?", cache({
  cacheName: "ucdjs:v1_unicode-proxy:wildcard",
  cacheControl: "max-age=3600", // 1 hour
}), async (c) => {
  return internalProxyRoute(c);
});
