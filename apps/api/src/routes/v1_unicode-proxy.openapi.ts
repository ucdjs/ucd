import type { RouteConfig } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import { ProxyResponseSchema } from "./v1_unicode-proxy.schemas";

const errorResponseSchema = z.object({
  message: z.string(),
  status: z.number(),
  path: z.string(),
  timestamp: z.string(),
});

const commonResponses = {
  200: {
    description: "Successful proxy response",
    content: {
      "application/json": {
        schema: ProxyResponseSchema,
      },
      "application/octet-stream": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  },
  404: {
    description: "Resource not found",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },
  500: {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },
} satisfies RouteConfig["responses"];

function createProxyRoute(segmentCount = 0) {
  const pathSegments = segmentCount === 0
    ? ""
    : Array.from({ length: segmentCount }, (_, i) => `/{path${i > 0 ? i + 1 : ""}}`).join("");

  const params: any = {};
  if (segmentCount > 0) {
    for (let i = 0; i < segmentCount; i++) {
      const paramName = i === 0 ? "path" : `path${i + 1}`;
      const examples = [
        "latest",
        "data",
        "blocks",
        "category",
        "subcategory",
        "ucd.all.json",
      ];
      const description = `The ${["first", "second", "third", "fourth", "fifth", "sixth"][i]} path segment, e.g., '${examples[i]}'`;
      params[paramName] = z.string().describe(description);
    }
  }

  const description = segmentCount === 0
    ? "Proxy requests to unicode-proxy.ucdjs.dev"
    : `Proxy requests to unicode-proxy.ucdjs.dev with ${segmentCount === 1 ? "one path segment" : `${segmentCount} path segments`}`;

  const routeConfig: RouteConfig = {
    method: "get",
    path: segmentCount === 0 ? "/" : pathSegments,
    tags: ["Unicode Proxy"],
    description,
    responses: commonResponses,
  };

  if (segmentCount > 0) {
    routeConfig.request = {
      params: z.object(params),
    } as const;
  }

  return createRoute(routeConfig);
}

export const ROOT_UNICODE_PROXY_ROUTE = createProxyRoute(0);
export const UNICODE_PROXY_ROUTE = createProxyRoute(1);
export const UNICODE_PROXY_ROUTE_2 = createProxyRoute(2);
export const UNICODE_PROXY_ROUTE_3 = createProxyRoute(3);
export const UNICODE_PROXY_ROUTE_4 = createProxyRoute(4);
export const UNICODE_PROXY_ROUTE_5 = createProxyRoute(5);
export const UNICODE_PROXY_ROUTE_6 = createProxyRoute(6);
export const UNICODE_PROXY_ROUTE_7 = createProxyRoute(7);
export const UNICODE_PROXY_ROUTE_8 = createProxyRoute(8);
export const UNICODE_PROXY_ROUTE_9 = createProxyRoute(9);
export const UNICODE_PROXY_ROUTE_10 = createProxyRoute(10);
