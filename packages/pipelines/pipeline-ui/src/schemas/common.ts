import { EXECUTION_STATUSES } from "@ucdjs/pipelines-executor";
import { z } from "zod";

export const ExecutionStatusSchema = z.enum(EXECUTION_STATUSES);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
