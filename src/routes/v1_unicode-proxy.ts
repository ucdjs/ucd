import type { StatusCode } from "hono/utils/http-status";
import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createError } from "../utils";
import { ROOT_UNICODE_PROXY_ROUTE, UNICODE_PROXY_ROUTE } from "./v1_unicode-proxy.openapi";

export const V1_UNICODE_PROXY_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-proxy");

V1_UNICODE_PROXY_ROUTER.openapi(ROOT_UNICODE_PROXY_ROUTE, async (c) => {
  try {
    const res = await fetch(c.env.PROXY_ENDPOINT, {
      method: "GET",
      headers: {
        "User-Agent": "api.ucdjs.dev/proxy",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return createError(c, 404, `Resource not found`);
      }
      return createError(c, 500, `Proxy request failed: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";

    return c.newResponse(res.body, res.status as StatusCode, {
      "Content-Type": contentType,
      "Content-Length": res.headers.get("content-length") || "",
      "Cache-Control": "public, max-age=3600",
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return createError(c, 500, "Failed to proxy request");
  }
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE, async (c) => {
  const { path } = c.req.valid("param");

  try {
    const res = await fetch(`${c.env.PROXY_ENDPOINT}/${path}`, {
      method: "GET",
      headers: {
        "User-Agent": "api.ucdjs.dev/proxy",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return createError(c, 404, `Resource not found: ${path}`);
      }
      return createError(c, 500, `Proxy request failed: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";

    return c.newResponse(res.body, res.status as StatusCode, {
      "Content-Type": contentType,
      "Content-Length": res.headers.get("content-length") || "",
      "Cache-Control": "public, max-age=3600",
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return createError(c, 500, "Failed to proxy request");
  }
});
