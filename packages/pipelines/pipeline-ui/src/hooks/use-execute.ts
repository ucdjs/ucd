import type { ExecutePipelineParams } from "../functions/executions";
import type { ExecuteResult } from "../types";
import { useMutation } from "@tanstack/react-query";
import { executePipelineMutationOptions } from "../functions";

export interface UseExecuteOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;
}

export interface UseExecuteReturn {
  execute: (params: ExecutePipelineParams) => Promise<ExecuteResult>;
  executing: boolean;
  result: ExecuteResult | null;
  error: string | null;
  executionId: string | null;
  reset: () => void;
}

export function useExecute(options: UseExecuteOptions = {}): UseExecuteReturn {
  const { baseUrl = "" } = options;

  const mutation = useMutation(executePipelineMutationOptions(baseUrl));

  const execute = (params: ExecutePipelineParams) =>
    mutation.mutateAsync(params);

  const error = (() => {
    if (mutation.error) {
      if (mutation.error instanceof Error) {
        return mutation.error.message;
      }
      return String(mutation.error);
    }
    if (mutation.data && !mutation.data.success) {
      return mutation.data.error ?? "Execution failed";
    }
    return null;
  })();

  const executionId = mutation.data?.executionId ?? null;

  return {
    execute,
    executing: mutation.isPending,
    result: mutation.data ?? null,
    error,
    executionId,
    reset: mutation.reset,
  };
}
