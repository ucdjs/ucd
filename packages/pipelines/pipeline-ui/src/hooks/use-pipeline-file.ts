import type { PipelineFileInfo } from "../types";
import { useQuery } from "@tanstack/react-query";
import { sourceFileQueryOptions } from "../functions";

export interface PipelineFileResponse {
  file?: PipelineFileInfo;
  error?: string;
}

export interface UsePipelineFileOptions {
  baseUrl?: string;
  sourceId: string;
}

export interface UsePipelineFileReturn {
  file: PipelineFileInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePipelineFile(
  fileId: string,
  options: UsePipelineFileOptions,
): UsePipelineFileReturn {
  const { baseUrl = "", sourceId } = options;

  const query = useQuery(sourceFileQueryOptions({ baseUrl, sourceId, fileId }));

  return {
    file: query.data?.file ?? null,
    loading: query.isFetching,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
