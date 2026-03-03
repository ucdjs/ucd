import type { SourceDetail, SourceList } from "../schemas/source";
import type { PipelineFileInfo, PipelinesResponse } from "../types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchSource, fetchSources } from "../functions";

export interface UsePipelinesOptions {
  /**
   * Base URL for the API (default: "")
   */
  baseUrl?: string;

  /**
   * Optional search query
   */
  search?: string;
}

export interface UsePipelinesReturn {
  data: PipelinesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePipelines(options: UsePipelinesOptions = {}): UsePipelinesReturn {
  const { baseUrl = "", search } = options;

  const query = useQuery<PipelinesResponse>({
    queryKey: ["pipelines", { baseUrl, search: search ?? "" }],
    queryFn: async () => {
      const sources = await fetchSources({ baseUrl }) as SourceList;
      const sourceDetails = await Promise.all(
        sources.map((source) => fetchSource({ baseUrl, sourceId: source.id })),
      ) as SourceDetail[];

      const errors = sourceDetails.flatMap((detail) => detail.errors);
      const files: PipelineFileInfo[] = sourceDetails.flatMap((detail) => detail.files).map((file) => ({
        fileId: file.fileId,
        filePath: file.filePath,
        fileLabel: file.fileLabel,
        sourceId: file.sourceId,
        pipelines: file.pipelines,
      }));

      return {
        workspaceId: "default",
        files,
        errors,
      } satisfies PipelinesResponse;
    },
  });

  const data = useMemo(() => {
    if (!query.data) return null;

    const queryValue = search?.trim().toLowerCase();
    if (!queryValue) return query.data;

    const files = query.data.files
      .map((file) => {
        const fileMatches = file.fileId.toLowerCase().includes(queryValue)
          || file.filePath.toLowerCase().includes(queryValue)
          || (file.fileLabel?.toLowerCase().includes(queryValue) ?? false);

        const pipelines = fileMatches
          ? file.pipelines
          : file.pipelines.filter((pipeline) => {
              const name = pipeline.name?.toLowerCase() ?? "";
              const description = pipeline.description?.toLowerCase() ?? "";
              return pipeline.id.toLowerCase().includes(queryValue)
                || name.includes(queryValue)
                || description.includes(queryValue);
            });

        if (pipelines.length === 0) {
          return null;
        }

        return {
          ...file,
          pipelines,
        };
      })
      .filter((file): file is NonNullable<typeof file> => file !== null);

    return {
      ...query.data,
      files,
    };
  }, [query.data, search]);

  return {
    data,
    loading: query.isFetching,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
