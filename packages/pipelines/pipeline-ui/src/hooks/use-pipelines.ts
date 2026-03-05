import type { PipelineFileInfo, PipelinesResponse } from "../types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { sourceFileQueryOptions, sourceQueryOptions, sourcesQueryOptions } from "../functions";

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
  const queryClient = useQueryClient();

  const query = useQuery<PipelinesResponse>({
    queryKey: ["pipelines", { baseUrl }],
    queryFn: async () => {
      const sources = await queryClient.ensureQueryData(sourcesQueryOptions({ baseUrl }));
      const sourceDetails = await Promise.all(
        sources.sources.map((source) =>
          queryClient.ensureQueryData(sourceQueryOptions({ baseUrl, sourceId: source.id })),
        ),
      );

      const filesById = new Map<string, PipelineFileInfo>();
      const errors: PipelinesResponse["errors"] = [];

      for (const source of sourceDetails) {
        if (!source) {
          continue;
        }

        errors.push(...source.sourceErrors);

        const fileDetails = await Promise.all(
          source.files.map((fileSummary) =>
            queryClient.ensureQueryData(sourceFileQueryOptions({
              baseUrl,
              sourceId: source.sourceId,
              fileId: fileSummary.fileId,
            })),
          ),
        );

        for (const fileDetailResponse of fileDetails) {
          if (!fileDetailResponse) {
            continue;
          }

          const sourceFile = fileDetailResponse.file;

          errors.push(...(sourceFile.errors ?? []));

          if (sourceFile.pipelines.length === 0) {
            continue;
          }

          const key = `${sourceFile.sourceId}:${sourceFile.fileId}`;
          const existing = filesById.get(key);
          if (existing) {
            existing.pipelines.push(...sourceFile.pipelines);
            continue;
          }

          filesById.set(key, {
            fileId: sourceFile.fileId,
            filePath: sourceFile.filePath,
            fileLabel: sourceFile.fileLabel,
            sourceId: sourceFile.sourceId,
            pipelines: [...sourceFile.pipelines],
          });
        }
      }

      return {
        workspaceId: "default",
        files: [...filesById.values()],
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
