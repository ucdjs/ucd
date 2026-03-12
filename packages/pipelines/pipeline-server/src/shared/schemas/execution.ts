import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type { PipelineSummary } from "@ucdjs/pipelines-executor";
import { EXECUTION_STATUSES } from "@ucdjs/pipelines-executor";
import z from "zod";
import { ExecutionGraphViewSchema } from "./graph";

const ExecutionStatusSchema = z.enum(EXECUTION_STATUSES);
const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

export const ExecutePipelineResponseSchema = z.object({
  success: z.boolean(),
  executionId: z.string().optional(),
  error: z.string().optional(),
});

export const PipelineSummarySchema = z.object({
  versions: z.array(z.string()),
  totalRoutes: z.number(),
  cached: z.number(),
  totalFiles: z.number(),
  matchedFiles: z.number(),
  skippedFiles: z.number(),
  fallbackFiles: z.number(),
  totalOutputs: z.number(),
  durationMs: z.number(),
});

export const ExecutionSummaryItemSchema = z.object({
  id: z.string(),
  sourceId: z.string().nullable(),
  fileId: z.string().nullable(),
  pipelineId: z.string(),
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

export const ExecutionEventItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  data: z.custom<PipelineEvent>(() => true).nullable(),
});

export const ExecutionEventsResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  events: z.array(ExecutionEventItemSchema),
  pagination: PaginationSchema,
});

export const ExecutionLogPayloadSchema = z.object({
  message: z.string(),
  stream: z.enum(["stdout", "stderr"]),
  args: z.array(z.unknown()).optional(),
  truncated: z.boolean().optional(),
  originalSize: z.number().optional(),
  event: z.custom<PipelineEvent>(() => true).optional(),
}).nullable();

export const ExecutionLogItemSchema = z.object({
  id: z.string(),
  spanId: z.string().nullable(),
  stream: z.enum(["stdout", "stderr"]),
  message: z.string(),
  timestamp: z.string(),
  payload: ExecutionLogPayloadSchema,
});

export const ExecutionLogsResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  logs: z.array(ExecutionLogItemSchema),
  truncated: z.boolean(),
  capturedSize: z.number(),
  originalSize: z.number().nullable(),
  pagination: PaginationSchema,
});

export const ExecutionGraphResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  graph: ExecutionGraphViewSchema.nullable(),
});

export function normalizeExecutionSummary(summary: Partial<PipelineSummary> | null | undefined): PipelineSummary | null {
  if (!summary) {
    return null;
  }

  return {
    versions: summary.versions ?? [],
    totalRoutes: summary.totalRoutes ?? summary.matchedFiles ?? 0,
    cached: summary.cached ?? 0,
    totalFiles: summary.totalFiles ?? 0,
    matchedFiles: summary.matchedFiles ?? summary.totalRoutes ?? 0,
    skippedFiles: summary.skippedFiles ?? 0,
    fallbackFiles: summary.fallbackFiles ?? 0,
    totalOutputs: summary.totalOutputs ?? 0,
    durationMs: summary.durationMs ?? 0,
  };
}

export type ExecutePipelineResponse = z.infer<typeof ExecutePipelineResponseSchema>;
export type ExecutionSummaryItem = z.infer<typeof ExecutionSummaryItemSchema>;
export type ExecutionsResponse = z.infer<typeof ExecutionsResponseSchema>;
export type ExecutionEventItem = z.infer<typeof ExecutionEventItemSchema>;
export type ExecutionEventsResponse = z.infer<typeof ExecutionEventsResponseSchema>;
export type ExecutionLogPayload = z.infer<typeof ExecutionLogPayloadSchema>;
export type ExecutionLogItem = z.infer<typeof ExecutionLogItemSchema>;
export type ExecutionLogsResponse = z.infer<typeof ExecutionLogsResponseSchema>;
export type ExecutionGraphResponse = z.infer<typeof ExecutionGraphResponseSchema>;
