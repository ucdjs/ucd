import { createRoute, z } from "@hono/zod-openapi";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { ProxyResponseSchema } from "./v1_unicode-proxy.schemas";

const WILDCARD_PARAM = {
  in: "path",
  name: "wildcard",
  description: "The path to proxy. Use a wildcard to match any path.",
  required: true,
  schema: {
    type: "string",
    pattern: ".*",
  },
  examples: {
    "UnicodeData.txt": {
      summary: "UnicodeData.txt for Unicode 15.0.0",
      value: "15.0.0/ucd/UnicodeData.txt",
    },
    "emoji-data.txt": {
      summary: "Emoji data file",
      value: "15.1.0/ucd/emoji/emoji-data.txt",
    },
    "root": {
      summary: "Root path",
      value: "",
    },
    "list-version-dir": {
      summary: "Versioned path",
      value: "15.1.0",
    },
  },
} as const;

export const UNICODE_PROXY_WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/{wildcard}",
  tags: [OPENAPI_TAGS.PROXY],
  description: "Proxy requests to unicode-proxy.ucdjs.dev",
  parameters: [
    WILDCARD_PARAM,
  ],
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
    ...(generateReferences([
      400,
      404,
      500,
      502,
    ])),
  },
});

export const UNICODE_PROXY_STAT_WILDCARD_ROUTE = createRoute({
  method: "get",
  path: "/__stat/{wildcard}",
  tags: [OPENAPI_TAGS.PROXY],
  description: "Proxy requests to unicode-proxy.ucdjs.dev",
  parameters: [
    WILDCARD_PARAM,
  ],
  responses: {
    200: {
      description: "Successful proxy response",
      content: {
        "application/json": {
          schema: z.object({
            type: z.enum(["file", "directory"]),
            mtime: z.string().openapi({
              description: "Last modified time of the file or directory",
            }),
            size: z.number().optional().openapi({
              description: "Size of the file in bytes, only present for files",
            }),
          }),
        },
      },
    },
    ...(generateReferences([
      400,
      404,
      500,
      502,
    ])),
  },
});
