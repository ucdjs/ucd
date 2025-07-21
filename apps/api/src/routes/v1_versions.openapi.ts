import { createRoute, z } from "@hono/zod-openapi";
import { cache } from "hono/cache";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { UnicodeVersionListSchema, UnicodeVersionMappingsSchema, UnicodeVersionSchema } from "./v1_versions.schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.VERSIONS],
  middleware: [
    cache({
      cacheName: "ucdjs:v1_versions:list",
      cacheControl: "max-age=345600", // 4 days
    }),
  ],
  description: "List all Unicode Versions available, including metadata and support status.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeVersionListSchema,
        },
      },
      description: "A list of Unicode versions with metadata and support status.",
    },
    ...(generateReferences([
      404,
      429,
      500,
    ])),
  },
});

export const LIST_VERSION_MAPPINGS = createRoute({
  method: "get",
  path: "/mappings",
  tags: [OPENAPI_TAGS.VERSIONS],
  description: "List all Unicode version mappings.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeVersionMappingsSchema,
        },
      },
      description: "A list of Unicode version mappings.",
    },
  },
});
