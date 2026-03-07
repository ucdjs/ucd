import type { PipelineInfo } from "../types";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export interface SourceFileResponse {
  id: string;
  path: string;
  label: string;
  sourceId: string;
  pipelines: PipelineInfo[];
}

export interface SourceFileParams {
  sourceId: string;
  fileId: string;
}

export async function fetchSourceFile({ sourceId, fileId }: SourceFileParams): Promise<SourceFileResponse> {
  return (await customFetch<SourceFileResponse>(`/api/sources/${sourceId}/files/${fileId}`)).data!;
}

export function sourceFileQueryOptions({ sourceId, fileId }: SourceFileParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: () => fetchSourceFile({ sourceId, fileId }),
    staleTime: 60_000,
  });
}
