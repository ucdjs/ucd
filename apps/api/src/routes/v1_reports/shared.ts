import { z } from "@hono/zod-openapi";
import { ReportRevisionReferenceSchema } from "./list";

export const NUMERIC_REVISION_ID_RE = /^\d+$/;

export const REPORT_ID_PARAM = {
  in: "path",
  name: "reportId",
  required: true,
  schema: {
    type: "string",
    pattern: "^tr\\d+[a-z0-9-]*$",
  },
  description: "Unicode report identifier such as tr44",
} as const;

export const REVISION_ID_PARAM = {
  in: "path",
  name: "revId",
  required: true,
  schema: {
    type: "string",
    pattern: "^(proposed|\\d+)$",
  },
  description: "A numeric revision id or the special proposed revision",
} as const;

export const UnicodeReportRevisionMetadataSchema = z.object({
  reportId: z.string(),
  title: z.string().nullable(),
  revision: ReportRevisionReferenceSchema,
  previous: ReportRevisionReferenceSchema.nullable(),
  next: ReportRevisionReferenceSchema.nullable(),
});
