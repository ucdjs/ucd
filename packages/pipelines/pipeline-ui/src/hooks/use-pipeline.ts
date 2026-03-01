import type { PipelineDetails } from "../types";
import { useCallback, useEffect, useState } from "react";
import { fetchPipeline as fetchPipelineBySource } from "../functions/fetch-pipeline";
import { ApiError } from "../functions/fetch-with-parse";

export interface UsePipelineOptions {
  /** Base URL for the API (default: "") */
  baseUrl?: string;
  /** Source ID for source-based API routes */
  sourceId: string;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UsePipelineReturn {
  pipeline: PipelineDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage a single pipeline by ID
 */
export function usePipeline(
  fileId: string,
  pipelineId: string,
  options: UsePipelineOptions,
): UsePipelineReturn {
  const { baseUrl = "", sourceId, fetchOnMount = true } = options;

  const [pipeline, setPipeline] = useState<PipelineDetails | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchPipelineBySource(baseUrl, sourceId, fileId, pipelineId);
      if (json.error) {
        setError(json.error);
        setPipeline(null);
      } else {
        setPipeline(json.pipeline ?? null);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.response.error);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pipeline");
      }
      setPipeline(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, fileId, pipelineId, sourceId]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchPipeline();
    }
  }, [fetchOnMount, fetchPipeline]);

  return {
    pipeline,
    loading,
    error,
    refetch: fetchPipeline,
  };
}
