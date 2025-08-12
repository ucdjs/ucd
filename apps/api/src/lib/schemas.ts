import { z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";

export const ApiErrorSchema = z.object({
  message: z.string().openapi({
    description: "Human-readable error message describing what went wrong",
  }),
  status: z.number().openapi({
    description: "HTTP status code matching the response status",
  }),
  timestamp: z.string().openapi({
    description: "ISO 8601 timestamp when the error occurred",
  }),
}).openapi("ApiError", {
  description: dedent`
    Standard error response format used consistently across all API endpoints.

    Contains essential information for debugging and user feedback. The specific error scenarios and status codes are documented in the individual endpoint response definitions.
  `,
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
