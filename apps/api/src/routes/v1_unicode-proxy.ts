import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createError } from "../utils";
import {
  UNICODE_PROXY_ROUTE,
} from "./v1_unicode-proxy.openapi";

export const V1_UNICODE_PROXY_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-proxy");

// A hack for OpenAPI not supporting splat routes
// So we register the path with a normal parameter named "wildcard",
// And then adds a normal route handler that matches any path using the wildcard parameter.
// This allows us to still describe the route in OpenAPI,
// while also allowing the actual route to match any path.

V1_UNICODE_PROXY_ROUTER.openAPIRegistry.registerPath(UNICODE_PROXY_ROUTE);

V1_UNICODE_PROXY_ROUTER.get("/:wildcard{.*}?", async (c) => {
  try {
    const path = c.req.param("wildcard")?.trim() || "";

    if (path.startsWith("..") || path.includes("//")) {
      return createError(c, 400, "Invalid path");
    }

    const req = new Request(path !== "" ? `${c.env.PROXY_ENDPOINT}/${path}` : c.env.PROXY_ENDPOINT);
    const res = await c.env.UNICODE_PROXY.fetch(req);

    if (!res.ok) {
      if (res.status === 404) {
        return createError(c, 404, path ? `Resource not found: ${path}` : "Resource not found");
      }
      return createError(c, 500, `Proxy request failed: ${res.statusText}`);
    }

    return c.newResponse(res.body, 200, {
      "Content-Type": res.headers.get("content-type") || "application/octet-stream",
      "Content-Length": res.headers.get("content-length") || "",
      "Cache-Control": "public, max-age=3600",
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return createError(c, 500, "Failed to proxy request");
  }
});
