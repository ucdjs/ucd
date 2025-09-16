import { dedent } from "@luxass/utils";
import { z } from "zod";

export const ApiErrorSchema = z.object({
  message: z.string().meta({
    description: "Human-readable error message describing what went wrong",
  }),
  status: z.number().meta({
    description: "HTTP status code matching the response status",
  }),
  timestamp: z.string().meta({
    description: "ISO 8601 timestamp when the error occurred",
  }),
}).meta({
  description: dedent`
    Standard error response format used consistently across all API endpoints.

    Contains essential information for debugging and user feedback. The specific error scenarios and status codes are documented in the individual endpoint response definitions.
  `,
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
