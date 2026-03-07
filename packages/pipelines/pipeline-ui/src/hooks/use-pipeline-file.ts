import type { PipelineFileInfo } from "../types";
import { sourceFileQueryOptions } from "../functions/file";
import { sourcesQueryOptions } from "../functions/sources";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export interface PipelineFileResponse {
  file?: PipelineFileInfo;
  error?: string;
}

export interface UsePipelineFileOptions {
  baseUrl?: string;
  fetchOnMount?: boolean;
}

export interface UsePipelineFileReturn {
  file: PipelineFileInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePipelineFile(
  fileId: string,
  options: UsePipelineFileOptions = {},
): UsePipelineFileReturn {
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

  const file = useMemo<PipelineFileInfo | null>(() => {
    for (const detail of sourceDetails) {
      const file = detail.data;
      if (!file) {
        continue;
      }

      return {
        fileId: file.id,
        filePath: file.path,
        fileLabel: file.label,
        sourceId: file.sourceId,
        pipelines: file.pipelines.map((pipeline) => ({
          ...pipeline,
          name: pipeline.name ?? pipeline.id,
          routeCount: 0,
          sourceCount: 0,
          sourceId: file.sourceId,
        })),
      };
    }

    return null;
  }, [fileId, sourceDetails]);

  const loading = sources.isLoading || sourceDetails.some((detail) => detail.isLoading);
  const error = sources.error?.message ?? sourceDetails.find((detail) => detail.error)?.error?.message ?? null;

  const refetch = useCallback(() => {
    void sources.refetch();
    void queryClient.invalidateQueries({ queryKey: ["sources"] });
  }, [queryClient, sources]);

  return {
    file,
    loading,
    error: error ?? (fetchOnMount && !loading && !file ? "Pipeline file not found" : null),
    refetch,
  };
}
