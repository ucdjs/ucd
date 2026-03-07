import type { PipelineDetails, PipelineResponse } from "../types";
import { pipelineQueryOptions } from "../functions/pipeline";
import { sourceFileQueryOptions } from "../functions/file";
import { sourcesQueryOptions } from "../functions/sources";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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
  fileId: string,
  pipelineId: string,
  options: UsePipelineOptions = {},
): UsePipelineReturn {
  const { baseUrl = "", fetchOnMount = true } = options;
  void baseUrl;

  const queryClient = useQueryClient();
  const sources = useQuery({
    ...sourcesQueryOptions(),
    enabled: fetchOnMount,
  });
  const sourceDetails = useQueries({
    queries: (sources.data ?? []).map((source) => ({
      ...sourceFileQueryOptions({ sourceId: source.id, fileId }),
      enabled: fetchOnMount,
    })),
  });

  const sourceId = useMemo(() => {
    for (const detail of sourceDetails) {
      const file = detail.data;
      if (!file) {
        continue;
      }

      if (file.pipelines.some((pipeline) => pipeline.id === pipelineId)) {
        return file.sourceId;
      }
    }

    return null;
  }, [fileId, pipelineId, sourceDetails]);

  const pipelineQuery = useQuery({
    ...pipelineQueryOptions({ sourceId: sourceId ?? "", fileId, pipelineId }),
    enabled: fetchOnMount && Boolean(sourceId),
  });

  const pipeline = pipelineQuery.data?.pipeline ?? null;
  const loading = sources.isLoading || sourceDetails.some((detail) => detail.isLoading) || pipelineQuery.isLoading;
  const error = sources.error?.message
    ?? sourceDetails.find((detail) => detail.error)?.error?.message
    ?? pipelineQuery.error?.message
    ?? (fetchOnMount && !loading && !pipeline ? "Pipeline not found" : null);

  const refetch = useCallback(() => {
    void sources.refetch();
    if (sourceId) {
      void pipelineQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["sources", sourceId] });
    }
  }, [pipelineQuery, queryClient, sourceId, sources]);

  return {
    pipeline,
    loading,
    error,
    refetch,
  };
}
