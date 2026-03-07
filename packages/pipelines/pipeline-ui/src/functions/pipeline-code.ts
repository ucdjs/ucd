import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export interface PipelineCodeResponse {
  code: string;
  exportName: string;
  file: { id: string; path: string; label: string };
}

export interface PipelineCodeParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export async function fetchPipelineCode({
  sourceId,
  fileId,
  pipelineId,
}: PipelineCodeParams): Promise<PipelineCodeResponse> {
  return (
    await customFetch<PipelineCodeResponse>(`/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/code`)
  ).data!;
}

export function pipelineCodeQueryOptions({ sourceId, fileId, pipelineId }: PipelineCodeParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "code"],
    queryFn: () => fetchPipelineCode({ sourceId, fileId, pipelineId }),
    staleTime: 60_000,
  });
}
