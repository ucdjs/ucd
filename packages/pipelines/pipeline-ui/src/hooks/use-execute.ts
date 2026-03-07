import type { ExecuteResult } from "../types";
import { executePipelineMutationOptions } from "../functions/execute";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface UseExecuteOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;
}

export interface UseExecuteReturn {
  execute: (
    ...args:
      | [sourceId: string, fileId: string, pipelineId: string, versions: string[]]
      | [fileId: string, pipelineId: string, versions: string[]]
  ) => Promise<ExecuteResult>;
  executing: boolean;
  result: ExecuteResult | null;
  error: string | null;
  executionId: string | null;
  reset: () => void;
}

function resolveSourceIdFromCache(queryClient: ReturnType<typeof useQueryClient>, fileId: string) {
  const sourceEntries = queryClient.getQueriesData<{ id: string; files: Array<{ id: string }> }>({
    queryKey: ["sources"],
  });

  for (const [, data] of sourceEntries) {
    if (!data || !("files" in data) || !Array.isArray(data.files)) {
      continue;
    }

    const hasFile = data.files.some((file) => file.id === fileId);
    if (hasFile) {
      return data.id;
    }
  }

  return null;
}

export function useExecute(options: UseExecuteOptions = {}): UseExecuteReturn {
  void options;
  const queryClient = useQueryClient();

  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const mutation = useMutation(useMemo(
    () => executePipelineMutationOptions(queryClient),
    [queryClient],
  ));

  const execute = useCallback(
    async (
      ...args:
        | [sourceId: string, fileId: string, pipelineId: string, versions: string[]]
        | [fileId: string, pipelineId: string, versions: string[]]
    ): Promise<ExecuteResult> => {
      const [sourceId, fileId, pipelineId, versions] = args.length === 4
        ? args
        : [resolveSourceIdFromCache(queryClient, args[0]), args[0], args[1], args[2]];

      setError(null);
      setResult(null);
      setExecutionId(null);

      if (!sourceId) {
        const resolutionError: ExecuteResult = {
          success: false,
          pipelineId,
          error: "Could not resolve source for pipeline execution",
        };
        setResult(resolutionError);
        setError(resolutionError.error ?? "Execution failed");
        return resolutionError;
      }

      try {
        const mutationResult = await mutation.mutateAsync({
          sourceId,
          fileId,
          pipelineId,
          versions,
        });

        if (mutationResult.success && mutationResult.executionId) {
          setExecutionId(mutationResult.executionId);
        } else {
          setError(mutationResult.error ?? "Execution failed");
        }

        setResult(mutationResult);
        return mutationResult;
      } catch (err) {
        const errorResult: ExecuteResult = {
          success: false,
          pipelineId,
          error: err instanceof Error ? err.message : String(err),
        };
        setResult(errorResult);
        setError(errorResult.error ?? "Execution failed");
        return errorResult;
      }
    },
    [mutation, queryClient],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setExecutionId(null);
  }, []);

  return {
    execute,
    executing: mutation.isPending,
    result,
    error,
    executionId,
    reset,
  };
}
