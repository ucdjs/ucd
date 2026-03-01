import { z } from "zod";
import { ExecutionStatusSchema } from "./common";

export const ExecutionSummarySchema = z.object({
  totalRoutes: z.number().optional(),
  cached: z.number().optional(),
});

export const ExecutionSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  versions: z.array(z.string()).nullable(),
  summary: ExecutionSummarySchema.nullable(),
  hasGraph: z.boolean().optional(),
  error: z.string().nullable(),
});
export type Execution = z.infer<typeof ExecutionSchema>;

export const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

export const ExecutionListResponseSchema = z.object({
  executions: z.array(ExecutionSchema),
  pagination: PaginationSchema,
});
export type ExecutionListResponse = z.infer<typeof ExecutionListResponseSchema>;

export const ExecutionEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  data: z.any(),
});
export type ExecutionEventItem = z.infer<typeof ExecutionEventSchema>;

export const ExecutionEventsResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  events: z.array(ExecutionEventSchema),
  pagination: PaginationSchema,
});
export type ExecutionEventsResponse = z.infer<typeof ExecutionEventsResponseSchema>;

export const ExecutionLogItemSchema = z.object({
  id: z.string(),
  spanId: z.string().nullable(),
  stream: z.enum(["stdout", "stderr"]),
  message: z.string(),
  timestamp: z.string(),
  payload: z.any().nullable(),
});
export type ExecutionLogItem = z.infer<typeof ExecutionLogItemSchema>;

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
export type ExecutionLogsResponse = z.infer<typeof ExecutionLogsResponseSchema>;

export const ExecutionGraphSchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export const ExecutionGraphResponseSchema = z.object({
  graph: ExecutionGraphSchema.nullable(),
});
export type ExecutionGraphResponse = z.infer<typeof ExecutionGraphResponseSchema>;

export const ExecutionDetailResponseSchema = z.object({
  execution: ExecutionSchema,
  events: z.array(ExecutionEventSchema),
  logs: z.array(ExecutionLogItemSchema),
});
export type ExecutionDetailResponse = z.infer<typeof ExecutionDetailResponseSchema>;
