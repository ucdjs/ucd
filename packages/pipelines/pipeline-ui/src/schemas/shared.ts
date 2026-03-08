import z from "zod";

export const SourceTypeSchema = z.enum(["local", "github", "gitlab"]);

export const ExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const PipelineLoaderIssueSchema = z.object({
  code: z.string(),
  scope: z.string(),
  message: z.string(),
  filePath: z.string().optional(),
  relativePath: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

export type SourceType = z.infer<typeof SourceTypeSchema>;
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
