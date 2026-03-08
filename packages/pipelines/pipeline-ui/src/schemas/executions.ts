import { ExecutionStatusSchema, PaginationSchema } from "./shared";
import z from "zod";

export const PipelineSummarySchema = z.object({
  versions: z.array(z.string()),
  totalFiles: z.number(),
  matchedFiles: z.number(),
  skippedFiles: z.number(),
  fallbackFiles: z.number(),
  totalOutputs: z.number(),
  durationMs: z.number(),
});

export const ExecutionSummaryItemSchema = z.object({
  id: z.string(),
  status: ExecutionStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  versions: z.array(z.string()).nullable(),
  summary: PipelineSummarySchema.nullable(),
  hasGraph: z.boolean(),
  error: z.string().nullable(),
});

export const ExecutionsResponseSchema = z.object({
  executions: z.array(ExecutionSummaryItemSchema),
  pagination: PaginationSchema,
});

export type ExecutionSummaryItem = z.infer<typeof ExecutionSummaryItemSchema>;
export type ExecutionsResponse = z.infer<typeof ExecutionsResponseSchema>;
