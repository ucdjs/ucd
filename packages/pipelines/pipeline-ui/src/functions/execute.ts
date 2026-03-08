import type { ExecuteResult } from "../types";
import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { ExecutePipelineResponseSchema, type ExecutePipelineResponse } from "../schemas/execute";

interface ExecutePipelineRequest {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  versions: string[];
  cache?: boolean;
}

export async function executePipeline({
  sourceId,
  fileId,
  pipelineId,
  versions,
  cache,
}: ExecutePipelineRequest): Promise<ExecuteResult> {
  const data = (
    await customFetch<ExecutePipelineResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/execute`,
      {
        method: "POST",
        body: { versions, cache },
        schema: ExecutePipelineResponseSchema,
      },
    )
  ).data!;

  if (data.success && data.executionId) {
    return {
      success: true,
      pipelineId,
      executionId: data.executionId,
    };
  }

  return {
    success: false,
    pipelineId,
    executionId: data.executionId,
    error: data.error ?? "Execution failed",
  };
}

export function executePipelineMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: executePipeline,
    onSuccess: async (_result, variables) => {
      const { sourceId, fileId, pipelineId } = variables;
      const baseKey = ["sources", sourceId, "files", fileId, "pipelines", pipelineId] as const;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...baseKey, "executions"] }),
        queryClient.invalidateQueries({ queryKey: baseKey }),
      ]);
    },
  });
}
