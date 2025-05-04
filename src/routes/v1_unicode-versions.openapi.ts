import { createRoute, z } from "@hono/zod-openapi";
import { ApiErrorSchema } from "../schemas";

export const FIRST_ROUTE = createRoute({
  method: "get",
  path: "/",
  tags: ["Versions"],
  description: "First Route",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
          }).openapi("MyUser"),
        },
      },
      description: "My User",
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
