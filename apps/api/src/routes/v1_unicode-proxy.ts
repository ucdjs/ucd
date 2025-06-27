import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createError } from "../utils";
import {
  ROOT_UNICODE_PROXY_ROUTE,
  UNICODE_PROXY_ROUTE,
  UNICODE_PROXY_ROUTE_2,
  UNICODE_PROXY_ROUTE_3,
  UNICODE_PROXY_ROUTE_4,
  UNICODE_PROXY_ROUTE_5,
  UNICODE_PROXY_ROUTE_6,
  UNICODE_PROXY_ROUTE_7,
  UNICODE_PROXY_ROUTE_8,
  UNICODE_PROXY_ROUTE_9,
  UNICODE_PROXY_ROUTE_10,
} from "./v1_unicode-proxy.openapi";

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

const routeConfigs = [
  { schema: ROOT_UNICODE_PROXY_ROUTE, params: [] },
  { schema: UNICODE_PROXY_ROUTE, params: ["path"] },
  { schema: UNICODE_PROXY_ROUTE_2, params: ["path", "path2"] },
  { schema: UNICODE_PROXY_ROUTE_3, params: ["path", "path2", "path3"] },
  { schema: UNICODE_PROXY_ROUTE_4, params: ["path", "path2", "path3", "path4"] },
  { schema: UNICODE_PROXY_ROUTE_5, params: ["path", "path2", "path3", "path4", "path5"] },
  { schema: UNICODE_PROXY_ROUTE_6, params: ["path", "path2", "path3", "path4", "path5", "path6"] },
  { schema: UNICODE_PROXY_ROUTE_7, params: ["path", "path2", "path3", "path4", "path5", "path6", "path7"] },
  { schema: UNICODE_PROXY_ROUTE_8, params: ["path", "path2", "path3", "path4", "path5", "path6", "path7", "path8"] },
  { schema: UNICODE_PROXY_ROUTE_9, params: ["path", "path2", "path3", "path4", "path5", "path6", "path7", "path8", "path9"] },
  { schema: UNICODE_PROXY_ROUTE_10, params: ["path", "path2", "path3", "path4", "path5", "path6", "path7", "path8", "path9", "path10"] },
];

routeConfigs.forEach(({ schema, params }) => {
  V1_UNICODE_PROXY_ROUTER.openapi(schema, async (c) => {
    if (params.length === 0) {
      return proxyRequest(c);
    }

    const pathSegments = params.map((param) => c.req.param(param));
    return proxyRequest(c, pathSegments.join("/"));
  });
});
