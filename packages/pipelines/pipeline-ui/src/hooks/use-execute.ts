import type { ExecuteResult } from "../types";
import { useCallback, useState } from "react";

export interface UseExecuteOptions {
  /** Base URL for the API (default: "") */
  baseUrl?: string;
}

export interface UseExecuteReturn {
  execute: (pipelineId: string, versions: string[]) => Promise<ExecuteResult>;
  executing: boolean;
  result: ExecuteResult | null;
  error: string | null;
  reset: () => void;
}

/**
 * Hook to execute a pipeline with selected versions
 */
export function useExecute(options: UseExecuteOptions = {}): UseExecuteReturn {
  const { baseUrl = "" } = options;

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (pipelineId: string, versions: string[]): Promise<ExecuteResult> => {
      setExecuting(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch(`${baseUrl}/api/pipelines/${pipelineId}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versions }),
        });
        const data: ExecuteResult = await res.json();
        setResult(data);
        return data;
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
  }, []);

  return {
    execute,
    executing,
    result,
    error,
    reset,
  };
}
