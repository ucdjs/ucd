import type { ExecuteResult } from "../types";
import { z } from "zod";

export const ExecuteResponseSchema = z.object({
  success: z.boolean(),
  executionId: z.string().optional(),
  error: z.string().optional(),
});

export type ExecuteResponse = z.infer<typeof ExecuteResponseSchema>;

export async function executePipeline(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  versions: string[],
): Promise<ExecuteResult> {
  const res = await fetch(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/execute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versions }),
    },
  );

  const data = await res.json();
  const parsed = ExecuteResponseSchema.parse(data);

  if (parsed.success && parsed.executionId) {
    return {
      success: true,
      pipelineId,
      executionId: parsed.executionId,
    };
  }

  return {
    success: false,
    pipelineId,
    executionId: parsed.executionId,
    error: parsed.error ?? "Execution failed",
  };
}
