import type { PipelineGraph } from "@ucdjs/pipelines-core";
import { ExecutionStatusSchema } from "./shared";
import z from "zod";

export const ExecutionGraphResponseSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: ExecutionStatusSchema,
  graph: z.custom<PipelineGraph>(() => true).nullable(),
});

export type ExecutionGraphResponse = z.infer<typeof ExecutionGraphResponseSchema>;
