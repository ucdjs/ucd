import { createRoute, z } from "@hono/zod-openapi";
import { generateReferences, OPENAPI_TAGS } from "../openapi";
import { UnicodeVersionFileSchema } from "./v1_files.schemas";

export const GET_UNICODE_FILES_BY_VERSION_ROUTE = createRoute({
  method: "get",
  path: "/{version}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [
    {
      name: "version",
      in: "path",
      required: true,
      description: "The Unicode version to get files for.",
      schema: {
        type: "string",
      },
    },
  ],
  description: "List all UCD files for a specific Unicode version.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(UnicodeVersionFileSchema).openapi("UnicodeVersionFiles"),
        },
      },
      description: "A list of UCD files for the specified Unicode version.",
    },
    ...(generateReferences([
      400,
      429,
      500,
      502,
    ])),
  },
});
