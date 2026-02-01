import type { PipelinesResponse } from "../types";
import { useCallback, useEffect, useState } from "react";

export interface UsePipelinesOptions {
  /** Base URL for the API (default: "") */
  baseUrl?: string;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UsePipelinesReturn {
  data: PipelinesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage the list of all pipelines
 */
export function usePipelines(options: UsePipelinesOptions = {}): UsePipelinesReturn {
  const { baseUrl = "", fetchOnMount = true } = options;

  const [data, setData] = useState<PipelinesResponse | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/pipelines`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchPipelines();
    }
  }, [fetchOnMount, fetchPipelines]);

  return {
    data,
    loading,
    error,
    refetch: fetchPipelines,
  };
}
