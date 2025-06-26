import { createRoute, z } from "@hono/zod-openapi";
import { ProxyResponseSchema } from "./v1_unicode-proxy.schemas";

export const ROOT_UNICODE_PROXY_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev",
  responses: {
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
          schema: z.object({
            message: z.string(),
            status: z.number(),
            path: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            status: z.number(),
            path: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
  },
});

export const UNICODE_PROXY_ROUTE = createRoute({
  method: "get",
  path: "/{path}",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev",
  parameters: [
    {
      in: "path",
      name: "path",
      style: "simple",
      explode: false,
    },
  ],
  request: {
    params: z.object({
      path: z.string().describe("The path to proxy, e.g., 'latest/ucd.all.json'"),
    }),
  },
  responses: {
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
          schema: z.object({
            message: z.string(),
            status: z.number(),
            path: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            status: z.number(),
            path: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
  },
});
