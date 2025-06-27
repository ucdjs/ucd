import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createError } from "../utils";
import { ROOT_UNICODE_PROXY_ROUTE, UNICODE_PROXY_ROUTE, UNICODE_PROXY_ROUTE_2, UNICODE_PROXY_ROUTE_3, UNICODE_PROXY_ROUTE_4, UNICODE_PROXY_ROUTE_5, UNICODE_PROXY_ROUTE_6 } from "./v1_unicode-proxy.openapi";

export const V1_UNICODE_PROXY_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/unicode-proxy");

async function proxyRequest(c: Context, path?: string) {
  try {
    const url = path ? `${c.env.PROXY_ENDPOINT}/${path}` : c.env.PROXY_ENDPOINT;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "api.ucdjs.dev/proxy",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return createError(c, 404, path ? `Resource not found: ${path}` : "Resource not found");
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
}

V1_UNICODE_PROXY_ROUTER.openapi(ROOT_UNICODE_PROXY_ROUTE, async (c) => {
  return proxyRequest(c);
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE, async (c) => {
  const { path } = c.req.valid("param");
  return proxyRequest(c, path);
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE_2, async (c) => {
  const { path, path2 } = c.req.valid("param");
  return proxyRequest(c, `${path}/${path2}`);
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE_3, async (c) => {
  const { path, path2, path3 } = c.req.valid("param");
  return proxyRequest(c, `${path}/${path2}/${path3}`);
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE_4, async (c) => {
  const { path, path2, path3, path4 } = c.req.valid("param");
  return proxyRequest(c, `${path}/${path2}/${path3}/${path4}`);
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE_5, async (c) => {
  const { path, path2, path3, path4, path5 } = c.req.valid("param");
  return proxyRequest(c, `${path}/${path2}/${path3}/${path4}/${path5}`);
});

V1_UNICODE_PROXY_ROUTER.openapi(UNICODE_PROXY_ROUTE_6, async (c) => {
  const { path, path2, path3, path4, path5, path6 } = c.req.valid("param");
  return proxyRequest(c, `${path}/${path2}/${path3}/${path4}/${path5}/${path6}`);
});
