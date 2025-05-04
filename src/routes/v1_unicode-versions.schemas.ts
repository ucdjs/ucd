import { z } from "@hono/zod-openapi";

export const UnicodeVersionSchema = z.object({
  version: z.string(),
  documentationUrl: z.string().url(),
  date: z.string().regex(/^\d{4}$/, "Year must be a four-digit number"),
  ucdUrl: z.string().url(),
}).openapi("UnicodeVersion");
export type UnicodeVersion = z.infer<typeof UnicodeVersionSchema>;
