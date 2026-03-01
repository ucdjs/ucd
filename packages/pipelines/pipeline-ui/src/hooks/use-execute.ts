import type { ExecuteResult } from "../types";
import { useCallback, useState } from "react";
import { executePipeline } from "../functions/execute-pipeline";

export interface UseExecuteOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;
}

export interface UseExecuteReturn {
  execute: (fileId: string, pipelineId: string, versions: string[], sourceId: string) => Promise<ExecuteResult>;
  executing: boolean;
  result: ExecuteResult | null;
  error: string | null;
  executionId: string | null;
  reset: () => void;
}

export function useExecute(options: UseExecuteOptions = {}): UseExecuteReturn {
  const { baseUrl = "" } = options;

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const execute = useCallback(
    async (fileId: string, pipelineId: string, versions: string[], sourceId: string): Promise<ExecuteResult> => {
      setExecuting(true);
      setError(null);
      setResult(null);
      setExecutionId(null);

      try {
        const result = await executePipeline(baseUrl, sourceId, fileId, pipelineId, versions);

        if (result.success && result.executionId) {
          setExecutionId(result.executionId);
        } else {
          setError(result.error ?? "Execution failed");
        }

        setResult(result);
        return result;
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
