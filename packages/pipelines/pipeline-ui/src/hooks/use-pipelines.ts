import type { PipelinesResponse } from "../types";
import { configQueryOptions } from "../functions/config";
import { sourceQueryOptions } from "../functions/source";
import { sourceFileQueryOptions } from "../functions/file";
import { sourcesQueryOptions } from "../functions/sources";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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
  const queryClient = useQueryClient();
  const config = useQuery({
    ...configQueryOptions({ baseUrl }),
    enabled: fetchOnMount,
  });
  const sources = useQuery({
    ...sourcesQueryOptions(),
    enabled: fetchOnMount,
  });
  const sourceDetails = useQueries({
    queries: (sources.data ?? []).map((source) => ({
      ...sourceQueryOptions({ sourceId: source.id }),
      enabled: fetchOnMount,
    })),
  });
  const fileDetails = useQueries({
    queries: sourceDetails.flatMap((detail) => {
      const source = detail.data;
      if (!source) {
        return [];
      }

      return source.files.map((file) => ({
        ...sourceFileQueryOptions({ sourceId: source.id, fileId: file.id }),
        enabled: fetchOnMount,
      }));
    }),
  });

  const data = useMemo<PipelinesResponse | null>(() => {
    if (!config.data?.data || !sources.data) {
      return null;
    }

    const query = search?.trim().toLowerCase();
    const files = sourceDetails.flatMap((detail) => {
      if (!detail.data) {
        return [];
      }

      return detail.data.files
        .map((file) => ({
          fileId: file.id,
          filePath: file.path,
          fileLabel: file.label,
          sourceId: detail.data!.id,
          pipelines: (fileDetails.find((candidate) =>
            candidate.data?.sourceId === detail.data!.id
            && candidate.data.id === file.id,
          )?.data?.pipelines ?? []).map((pipeline) => ({
            ...pipeline,
            name: pipeline.name ?? pipeline.id,
            routeCount: 0,
            sourceCount: 0,
            sourceId: detail.data!.id,
          })),
        }))
        .filter((file) => {
          if (!query) {
            return true;
          }

          return file.fileLabel?.toLowerCase().includes(query)
            || file.pipelines.some((pipeline) =>
              pipeline.id.toLowerCase().includes(query)
              || pipeline.name?.toLowerCase().includes(query),
            );
        });
    });

    const errors = sourceDetails.flatMap((detail) =>
      detail.error instanceof Error ? [{ filePath: "", message: detail.error.message }] : [],
    );

    return {
      workspaceId: config.data.data.workspaceId,
      files,
      errors,
    };
  }, [config.data, fileDetails, search, sourceDetails, sources.data]);

  const loading = config.isLoading
    || sources.isLoading
    || sourceDetails.some((detail) => detail.isLoading)
    || fileDetails.some((detail) => detail.isLoading);
  const error = config.error?.message
    ?? sources.error?.message
    ?? sourceDetails.find((detail) => detail.error)?.error?.message
    ?? fileDetails.find((detail) => detail.error)?.error?.message
    ?? null;

  const refetch = useCallback(() => {
    void config.refetch();
    void sources.refetch();
    void queryClient.invalidateQueries({ queryKey: ["sources"] });
  }, [config, queryClient, sources]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
