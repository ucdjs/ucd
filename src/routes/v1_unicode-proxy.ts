import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createError } from "../utils";
import { ROOT_UNICODE_PROXY_ROUTE, UNICODE_PROXY_ROUTE } from "./v1_unicode-proxy.openapi";

export const V1_UNICODE_PROXY_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-proxy");

V1_UNICODE_PROXY_ROUTER.openapi(ROOT_UNICODE_PROXY_ROUTE, async (c) => {
  try {
    const response = await fetch(c.env.PROXY_ENDPOINT, {
      method: "GET",
      headers: {
        "User-Agent": "api.ucdjs.dev/proxy",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return createError(c, 404, `Resource not found`);
      }
      return createError(c, response.status, `Proxy request failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // If it's JSON, it's likely a directory listing
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return c.json(data, 200);
    }

    // For binary/text files, stream the response
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": response.headers.get("content-length") || "",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return createError(c, 500, "Failed to proxy request");
  }
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE, async (c) => {
  const { path } = c.req.valid("param");

  try {
    const response = await fetch(`${c.env.PROXY_ENDPOINT}/${path}`, {
      method: "GET",
      headers: {
        "User-Agent": "api.ucdjs.dev/proxy",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return createError(c, 404, `Resource not found: ${path}`);
      }
      return createError(c, response.status, `Proxy request failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // If it's JSON, it's likely a directory listing
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return c.json(data, 200);
    }

    // For binary/text files, stream the response
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": response.headers.get("content-length") || "",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return createError(c, 500, "Failed to proxy request");
  }
});
