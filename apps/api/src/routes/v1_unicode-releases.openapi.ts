import { createRoute, z } from "@hono/zod-openapi";
import { ApiErrorSchema } from "@ucdjs/worker-shared";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { UnicodeVersionSchema } from "./v1_unicode-releases.schemas";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: [OPENAPI_TAGS.RELEASES],
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
    ...(generateReferences([
      404,
      429,
      500,
    ])),
  },
});
