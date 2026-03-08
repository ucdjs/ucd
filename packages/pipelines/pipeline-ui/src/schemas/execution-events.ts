import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { ExecutionStatusSchema, PaginationSchema } from "./shared";
import z from "zod";

export const ExecutionEventItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  data: z.custom<PipelineEvent>(() => true),
});

export const ExecutionEventsResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  events: z.array(ExecutionEventItemSchema),
  pagination: PaginationSchema,
});

export type ExecutionEventItem = z.infer<typeof ExecutionEventItemSchema>;
export type ExecutionEventsResponse = z.infer<typeof ExecutionEventsResponseSchema>;
