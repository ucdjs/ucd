import type { PipelinesResponse } from "../types";
import { useCallback, useEffect, useState } from "react";
import { fetchSource } from "../functions/fetch-source";
import { fetchSources } from "../functions/fetch-sources";
import { ApiError } from "../functions/fetch-with-parse";

export interface UsePipelinesOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;

  /**
   * Optional search query
   */
  search?: string;

  /**
   * Whether to fetch on mount (default: true)
   */
  fetchOnMount?: boolean;
}

export interface UsePipelinesReturn {
  data: PipelinesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePipelines(options: UsePipelinesOptions = {}): UsePipelinesReturn {
  const { baseUrl = "", search, fetchOnMount = true } = options;

  const [data, setData] = useState<PipelinesResponse | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sources = await fetchSources(baseUrl);
      const sourceDetails = await Promise.all(sources.map((source) => fetchSource(baseUrl, source.id)));

      const query = search?.trim().toLowerCase();

      const files = sourceDetails.flatMap((detail) => detail.files)
        .map((file) => {
          if (!query) {
            return {
              fileId: file.fileId,
              filePath: file.filePath,
              fileLabel: file.fileLabel,
              sourceId: file.sourceId,
              pipelines: file.pipelines,
            };
          }

          const fileMatches = file.fileId.toLowerCase().includes(query)
            || file.filePath.toLowerCase().includes(query)
            || file.fileLabel.toLowerCase().includes(query);

          const pipelines = fileMatches
            ? file.pipelines
            : file.pipelines.filter((pipeline) => {
                const name = pipeline.name?.toLowerCase() ?? "";
                const description = pipeline.description?.toLowerCase() ?? "";
                return pipeline.id.toLowerCase().includes(query)
                  || name.includes(query)
                  || description.includes(query);
              });

          if (pipelines.length === 0) {
            return null;
          }

          return {
            fileId: file.fileId,
            filePath: file.filePath,
            fileLabel: file.fileLabel,
            sourceId: file.sourceId,
            pipelines,
          };
        })
        .filter((file): file is NonNullable<typeof file> => file !== null);

      const errors = sourceDetails.flatMap((detail) => detail.errors);

      setData({
        workspaceId: "default",
        files,
        errors,
      } satisfies PipelinesResponse);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.response.error);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pipelines");
      }
    } finally {
      setLoading(false);
    }
  }, [baseUrl, search]);

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
