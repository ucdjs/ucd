import type { PipelineDetails } from "../types";
import { queryOptions } from "@tanstack/react-query";

export interface PipelineResponse {
  pipeline: PipelineDetails;
  file: { id: string; path: string; label: string };
  source: { id: string; type: string; label: string };
}

export async function fetchPipeline(
  sourceId: string,
  fileId: string,
  pipelineId: string,
): Promise<PipelineResponse> {
  const res = await fetch(`/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch pipeline "${pipelineId}": HTTP ${res.status}`);
  }
  return res.json();
}

export function pipelineQueryOptions(sourceId: string, fileId: string, pipelineId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId],
    queryFn: () => fetchPipeline(sourceId, fileId, pipelineId),
  });
}
