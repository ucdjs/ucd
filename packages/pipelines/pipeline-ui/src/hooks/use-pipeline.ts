import type { PipelineDetails } from "../types";
import { useQuery } from "@tanstack/react-query";
import { pipelineQueryOptions } from "../functions";

export interface UsePipelineOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;

  /**
   * Source ID for source-based API routes
   */
  sourceId: string;
}

export interface UsePipelineReturn {
  pipeline: PipelineDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePipeline(
  fileId: string,
  pipelineId: string,
  options: UsePipelineOptions,
): UsePipelineReturn {
  const { baseUrl = "", sourceId } = options;

  const query = useQuery(pipelineQueryOptions({
    baseUrl,
    sourceId,
    fileId,
    pipelineId,
  }));

  return {
    pipeline: query.data?.pipeline ?? null,
    loading: query.isFetching,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
