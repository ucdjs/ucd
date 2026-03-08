import { PipelineLoaderIssueSchema, SourceTypeSchema } from "./shared";
import z from "zod";

export const SourceFileInfoSchema = z.object({
  id: z.string(),
  path: z.string(),
  label: z.string(),
});

export const SourceResponseSchema = z.object({
  id: z.string(),
  type: SourceTypeSchema,
  label: z.string(),
  files: z.array(SourceFileInfoSchema),
  errors: z.array(PipelineLoaderIssueSchema),
});

export const SourceSummarySchema = z.object({
  id: z.string(),
  type: SourceTypeSchema,
  label: z.string(),
  fileCount: z.number(),
  pipelineCount: z.number(),
  errors: z.array(PipelineLoaderIssueSchema),
});

export const SourcesResponseSchema = z.array(SourceSummarySchema);

export type SourceFileInfo = z.infer<typeof SourceFileInfoSchema>;
export type SourceResponse = z.infer<typeof SourceResponseSchema>;
export type SourceSummary = z.infer<typeof SourceSummarySchema>;
