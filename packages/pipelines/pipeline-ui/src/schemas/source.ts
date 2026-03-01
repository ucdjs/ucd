import { z } from "zod";
import { PipelineInfoSchema } from "./pipeline";

export const SourceSchema = z.object({
  id: z.string(),
  type: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const SourceListResponseSchema = z.array(SourceSchema);
export type SourceListResponse = z.infer<typeof SourceListResponseSchema>;

export const SourceFileSchema = z.object({
  fileId: z.string(),
  filePath: z.string(),
  sourceFilePath: z.string().optional(),
  fileLabel: z.string(),
  sourceId: z.string(),
  pipelines: z.array(PipelineInfoSchema),
});
export type SourceFile = z.infer<typeof SourceFileSchema>;

export const PipelineLoadErrorSchema = z.object({
  filePath: z.string(),
  message: z.string(),
  sourceId: z.string(),
});
export type PipelineLoadError = z.infer<typeof PipelineLoadErrorSchema>;

export const SourceDetailResponseSchema = z.object({
  sourceId: z.string(),
  files: z.array(SourceFileSchema),
  errors: z.array(PipelineLoadErrorSchema),
});
export type SourceDetailResponse = z.infer<typeof SourceDetailResponseSchema>;

export const SourceFileResponseSchema = z.object({
  sourceId: z.string(),
  fileId: z.string(),
  file: SourceFileSchema,
  errors: z.array(PipelineLoadErrorSchema),
});
export type SourceFileResponse = z.infer<typeof SourceFileResponseSchema>;
