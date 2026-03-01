import { z } from "zod";
import { PipelineInfoSchema } from "./pipeline";

export const SourceSchema = z.object({
  id: z.string(),
  type: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const SourceListSchema = z.array(SourceSchema);
export type SourceList = z.infer<typeof SourceListSchema>;

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

export const SourceDetailSchema = z.object({
  sourceId: z.string(),
  files: z.array(SourceFileSchema),
  errors: z.array(PipelineLoadErrorSchema),
});
export type SourceDetail = z.infer<typeof SourceDetailSchema>;

export const SourceFileResponseSchema = z.object({
  sourceId: z.string(),
  fileId: z.string(),
  file: SourceFileSchema,
  errors: z.array(PipelineLoadErrorSchema),
});
export type SourceFileResponse = z.infer<typeof SourceFileResponseSchema>;
