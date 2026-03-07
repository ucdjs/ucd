import { queryOptions } from "@tanstack/react-query";

export interface PipelineCodeResponse {
  code: string;
  exportName: string;
  file: { id: string; path: string; label: string };
}

export async function fetchPipelineCode(
  sourceId: string,
  fileId: string,
  pipelineId: string,
): Promise<PipelineCodeResponse> {
  const res = await fetch(`/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/code`);
  if (!res.ok) {
    throw new Error(`Failed to fetch pipeline code for "${pipelineId}": HTTP ${res.status}`);
  }
  return res.json();
}

export function pipelineCodeQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "code"],
    queryFn: () => fetchPipelineCode(sourceId, fileId, pipelineId),
  });
}
