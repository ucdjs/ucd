import { z } from "zod";
import { PipelineInfoSchema } from "./pipeline";

export const SourceSchema = z.object({
  id: z.string(),
  type: z.enum(["local", "github", "gitlab"]),
  hasErrors: z.boolean(),
  fileCount: z.number(),
  pipelineCount: z.number(),
  pipelines: z.array(PipelineInfoSchema),
});
export type Source = z.infer<typeof SourceSchema>;

export const SourceListSchema = z.object({
  sources: z.array(SourceSchema),
});
export type SourceList = z.infer<typeof SourceListSchema>;

const SourceFileBaseSchema = z.object({
  fileId: z.string(),
  filePath: z.string(),
  sourceFilePath: z.string().optional(),
  fileLabel: z.string(),
  sourceId: z.string(),
});

export const PipelineLoadErrorSchema = z.object({
  code: z.enum([
    "DISCOVERY_FAILED",
    "CACHE_MISS",
    "SYNC_FAILED",
    "BUNDLE_FAILED",
    "IMPORT_FAILED",
    "INVALID_EXPORT",
    "UNKNOWN",
  ]),
  scope: z.enum(["file", "source"]),
  message: z.string(),
  filePath: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type PipelineLoadError = z.infer<typeof PipelineLoadErrorSchema>;

export const SourceFileSummarySchema = SourceFileBaseSchema.extend({
  pipelineCount: z.number(),
  hasErrors: z.boolean(),
  errorCount: z.number(),
  pipelines: z.array(PipelineInfoSchema),
});
export type SourceFileSummary = z.infer<typeof SourceFileSummarySchema>;

export const SourceFileSchema = SourceFileBaseSchema.extend({
  pipelines: z.array(PipelineInfoSchema),
  errors: z.array(PipelineLoadErrorSchema).optional(),
});
export type SourceFile = z.infer<typeof SourceFileSchema>;

export const SourceSummarySchema = z.object({
  sourceId: z.string(),
  files: z.array(SourceFileSummarySchema),
  sourceErrors: z.array(PipelineLoadErrorSchema),
});
export type SourceSummary = z.infer<typeof SourceSummarySchema>;

// Backward compatible alias: source detail endpoint now returns summary payload.
export const SourceDetailSchema = SourceSummarySchema;
export type SourceDetail = SourceSummary;

export const SourceFileResponseSchema = z.object({
  sourceId: z.string(),
  fileId: z.string(),
  file: SourceFileSchema,
  sourceErrors: z.array(PipelineLoadErrorSchema).optional(),
});
export type SourceFileResponse = z.infer<typeof SourceFileResponseSchema>;
