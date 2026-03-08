import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { ExecutionStatusSchema, PaginationSchema } from "./shared";
import z from "zod";

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

export type ExecutionLogPayload = z.infer<typeof ExecutionLogPayloadSchema>;
export type ExecutionLogItem = z.infer<typeof ExecutionLogItemSchema>;
export type ExecutionLogsResponse = z.infer<typeof ExecutionLogsResponseSchema>;
