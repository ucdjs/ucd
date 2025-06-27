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

export const UNICODE_PROXY_ROUTE_2 = createRoute({
  method: "get",
  path: "/{path}/{path2}",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev with two path segments",
  request: {
    params: z.object({
      path: z.string().describe("The first path segment, e.g., 'latest'"),
      path2: z.string().describe("The second path segment, e.g., 'ucd.all.json'"),
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

export const UNICODE_PROXY_ROUTE_3 = createRoute({
  method: "get",
  path: "/{path}/{path2}/{path3}",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev with three path segments",
  request: {
    params: z.object({
      path: z.string().describe("The first path segment, e.g., 'latest'"),
      path2: z.string().describe("The second path segment, e.g., 'data'"),
      path3: z.string().describe("The third path segment, e.g., 'ucd.all.json'"),
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

export const UNICODE_PROXY_ROUTE_4 = createRoute({
  method: "get",
  path: "/{path}/{path2}/{path3}/{path4}",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev with four path segments",
  request: {
    params: z.object({
      path: z.string().describe("The first path segment, e.g., 'latest'"),
      path2: z.string().describe("The second path segment, e.g., 'data'"),
      path3: z.string().describe("The third path segment, e.g., 'blocks'"),
      path4: z.string().describe("The fourth path segment, e.g., 'ucd.all.json'"),
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

export const UNICODE_PROXY_ROUTE_5 = createRoute({
  method: "get",
  path: "/{path}/{path2}/{path3}/{path4}/{path5}",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev with five path segments",
  request: {
    params: z.object({
      path: z.string().describe("The first path segment, e.g., 'latest'"),
      path2: z.string().describe("The second path segment, e.g., 'data'"),
      path3: z.string().describe("The third path segment, e.g., 'blocks'"),
      path4: z.string().describe("The fourth path segment, e.g., 'category'"),
      path5: z.string().describe("The fifth path segment, e.g., 'ucd.all.json'"),
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

export const UNICODE_PROXY_ROUTE_6 = createRoute({
  method: "get",
  path: "/{path}/{path2}/{path3}/{path4}/{path5}/{path6}",
  tags: ["Unicode Proxy"],
  description: "Proxy requests to unicode-proxy.ucdjs.dev with six path segments",
  request: {
    params: z.object({
      path: z.string().describe("The first path segment, e.g., 'latest'"),
      path2: z.string().describe("The second path segment, e.g., 'data'"),
      path3: z.string().describe("The third path segment, e.g., 'blocks'"),
      path4: z.string().describe("The fourth path segment, e.g., 'category'"),
      path5: z.string().describe("The fifth path segment, e.g., 'subcategory'"),
      path6: z.string().describe("The sixth path segment, e.g., 'ucd.all.json'"),
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
