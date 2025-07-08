import { createRoute, z } from "@hono/zod-openapi";
import { ApiErrorSchema } from "@ucdjs/worker-shared";
import { UnicodeVersionSchema } from "./v1_unicode-releases.schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: ["Unicode Releases"],
  description: "List all Unicode Versions available, including metadata and support status.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(UnicodeVersionSchema).openapi("UnicodeVersions"),
        },
      },
      description: "A list of Unicode versions with metadata and support status.",
    },
    404: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Not Found",
    },
    429: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Rate Limit Exceeded",
    },
    500: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
});

