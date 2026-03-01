import { z } from "zod";

export const ExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
