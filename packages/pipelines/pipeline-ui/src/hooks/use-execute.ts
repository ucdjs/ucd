import type { ExecuteResult } from "../types";
import { useCallback, useState } from "react";

export interface UseExecuteOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;
}

export interface UseExecuteReturn {
  execute: (pipelineId: string, versions: string[]) => Promise<ExecuteResult>;
  executing: boolean;
  result: ExecuteResult | null;
  error: string | null;
  executionId: string | null;
  reset: () => void;
}

interface ExecuteApiResponse {
  success: boolean;
  executionId?: string;
  error?: string;
}

export function useExecute(options: UseExecuteOptions = {}): UseExecuteReturn {
  const { baseUrl = "" } = options;

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const execute = useCallback(
    async (pipelineId: string, versions: string[]): Promise<ExecuteResult> => {
      setExecuting(true);
      setError(null);
      setResult(null);
      setExecutionId(null);

      try {
        const res = await fetch(`${baseUrl}/api/pipelines/${pipelineId}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versions }),
        });
        const data: ExecuteApiResponse = await res.json();

        // Handle the new API response format
        if (data.success && data.executionId) {
          setExecutionId(data.executionId);
          const successResult: ExecuteResult = {
            success: true,
            pipelineId,
            executionId: data.executionId,
          };
          setResult(successResult);
          return successResult;
        } else {
          const errorResult: ExecuteResult = {
            success: false,
            pipelineId,
            executionId: data.executionId,
            error: data.error ?? "Execution failed",
          };
          setResult(errorResult);
          setError(errorResult.error ?? "Execution failed");
          return errorResult;
        }
      } catch (err) {
        const errorResult: ExecuteResult = {
          success: false,
          pipelineId,
          error: err instanceof Error ? err.message : String(err),
        };
        setResult(errorResult);
        setError(errorResult.error ?? "Execution failed");
        return errorResult;
      } finally {
        setExecuting(false);
      }
    },
    [baseUrl],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setExecutionId(null);
  }, []);

  return {
    execute,
    executing,
    result,
    error,
    executionId,
    reset,
  };
}
