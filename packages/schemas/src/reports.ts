import { z } from "zod";

export const ReportRevisionReferenceSchema = z.object({
  revId: z.string(),
  revision: z.number().nullable(),
  htmlPath: z.string(),
  upstreamUrl: z.string().url(),
});

export type ReportRevisionReference = z.infer<typeof ReportRevisionReferenceSchema>;

export const UnicodeReportSummarySchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  latest: ReportRevisionReferenceSchema.nullable(),
  previous: ReportRevisionReferenceSchema.nullable(),
  next: ReportRevisionReferenceSchema.nullable(),
});

export type UnicodeReportSummary = z.infer<typeof UnicodeReportSummarySchema>;

export const UnicodeReportRevisionMetadataSchema = z.object({
  reportId: z.string(),
  title: z.string().nullable(),
  revision: ReportRevisionReferenceSchema,
  previous: ReportRevisionReferenceSchema.nullable(),
  next: ReportRevisionReferenceSchema.nullable(),
});

export type UnicodeReportRevisionMetadata = z.infer<typeof UnicodeReportRevisionMetadataSchema>;
