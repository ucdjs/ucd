import z from "zod";

export const ExecutePipelineResponseSchema = z.object({
  success: z.boolean(),
  executionId: z.string().optional(),
  error: z.string().optional(),
});

export type ExecutePipelineResponse = z.infer<typeof ExecutePipelineResponseSchema>;
