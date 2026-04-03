import { EXECUTION_STATUSES } from "@ucdjs/pipeline-executor";
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
  hasTraces: z.boolean().optional(),
  error: z.string().nullable(),
});

export const ExecutionsResponseSchema = z.object({
  executions: z.array(ExecutionSummaryItemSchema),
  pagination: PaginationSchema,
});

export const SpanEventSchema = z.object({
  timestamp: z.number(),
  kind: z.string(),
  attributes: z.unknown(),
});

export const ExecutionSpanItemSchema = z.object({
  id: z.string(),
  spanId: z.string().nullable(),
  parentSpanId: z.string().nullable(),
  kind: z.string(),
  startTimestamp: z.number().nullable(),
  durationMs: z.number().nullable(),
  attributes: z.unknown(),
  events: z.array(SpanEventSchema),
});

export const ExecutionLogPayloadSchema = z.object({
  args: z.array(z.unknown()).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  truncated: z.boolean().optional(),
  originalSize: z.number().optional(),
  isBanner: z.boolean().optional(),
}).nullable();

export const ExecutionLogItemSchema = z.object({
  id: z.string(),
  spanId: z.string().nullable(),
  message: z.string(),
  timestamp: z.string(),
  level: z.enum(["debug", "info", "warn", "error"]).nullable(),
  source: z.enum(["logger", "console", "stdio"]).nullable(),
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

export const OutputManifestItemSchema = z.object({
  outputIndex: z.number(),
  outputId: z.string(),
  routeId: z.string(),
  pipelineId: z.string(),
  version: z.string(),
  property: z.string().optional(),
  sink: z.string(),
  format: z.enum(["json", "text"]),
  locator: z.string(),
  status: z.enum(["resolved", "written", "failed"]),
  error: z.string().optional(),
});

export const ExecutionTracesResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  traceId: z.string().nullable(),
  startTimestamp: z.number().nullable(),
  durationMs: z.number().nullable(),
  spans: z.array(ExecutionSpanItemSchema),
  outputManifest: z.array(OutputManifestItemSchema),
});

export type ExecutePipelineResponse = z.infer<typeof ExecutePipelineResponseSchema>;
export type ExecutionSummaryItem = z.infer<typeof ExecutionSummaryItemSchema>;
export type ExecutionsResponse = z.infer<typeof ExecutionsResponseSchema>;
export type ExecutionLogPayload = z.infer<typeof ExecutionLogPayloadSchema>;
export type ExecutionLogItem = z.infer<typeof ExecutionLogItemSchema>;
export type ExecutionLogsResponse = z.infer<typeof ExecutionLogsResponseSchema>;
export type ExecutionGraphResponse = z.infer<typeof ExecutionGraphResponseSchema>;
export type SpanEvent = z.infer<typeof SpanEventSchema>;
export type ExecutionSpanItem = z.infer<typeof ExecutionSpanItemSchema>;
export type OutputManifestItem = z.infer<typeof OutputManifestItemSchema>;
export type ExecutionTracesResponse = z.infer<typeof ExecutionTracesResponseSchema>;
