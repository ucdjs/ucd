import type { ExecuteResult } from "#shared/types";
import { executePipelineMutationOptions } from "#queries/execution";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface UseExecuteReturn {
  execute: (
    sourceId: string,
    fileId: string,
    pipelineId: string,
    versions: string[],
  ) => Promise<ExecuteResult>;
  executing: boolean;
  result: ExecuteResult | null;
  error: string | null;
  executionId: string | null;
  reset: () => void;
}

export function useExecute(): UseExecuteReturn {
  const queryClient = useQueryClient();

  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const mutation = useMutation(useMemo(
    () => executePipelineMutationOptions(queryClient),
    [queryClient],
  ));

  const execute = useCallback(
    async (sourceId: string, fileId: string, pipelineId: string, versions: string[]): Promise<ExecuteResult> => {
      setError(null);
      setResult(null);
      setExecutionId(null);

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
    [mutation],
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
