import { createRoute, z } from "@hono/zod-openapi";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { UnicodeVersionMappingsSchema, UnicodeVersionSchema } from "./v1_unicode-versions.schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.MISC],
  deprecated: true,
  description: "List all Unicode Versions available, including metadata.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(UnicodeVersionSchema).openapi("UnicodeVersions"),
        },
      },
      description: "A list of Unicode versions with metadata.",
    },
    ...(generateReferences([
      404,
      429,
      500,
    ])),
  },
});

export const GET_UNICODE_MAPPINGS = createRoute({
  method: "get",
  path: "/mappings",
  tags: [OPENAPI_TAGS.MISC],
  deprecated: true,
  description: "List all Unicode Versions mappings",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UnicodeVersionMappingsSchema,
        },
      },
      description: "A list of Unicode versions mappings",
    },
    ...(generateReferences([
      500,
    ])),
  },
});
