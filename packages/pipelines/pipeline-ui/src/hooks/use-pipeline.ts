import type { PipelineDetails, PipelineResponse } from "../types";
import { useCallback, useEffect, useState } from "react";

export interface UsePipelineOptions {
  /** Base URL for the API (default: "") */
  baseUrl?: string;
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
  pipelineId: string,
  options: UsePipelineOptions = {},
): UsePipelineReturn {
  const { baseUrl = "", fetchOnMount = true } = options;

  const [pipeline, setPipeline] = useState<PipelineDetails | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/pipelines/${pipelineId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: PipelineResponse = await res.json();
      if (json.error) {
        setError(json.error);
        setPipeline(null);
      } else {
        setPipeline(json.pipeline ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
      setPipeline(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, pipelineId]);

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
