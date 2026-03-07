import type { PipelineGraph } from "@ucdjs/pipelines-core";
import { queryOptions } from "@tanstack/react-query";

export interface ExecutionGraphResponse {
  executionId: string;
  pipelineId: string;
  graph: PipelineGraph | null;
}

export async function fetchExecutionGraph(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionGraphResponse> {
  const res = await fetch(
    `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/graph`,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch execution graph: HTTP ${res.status}`);
  }
  return res.json();
}

export function executionGraphQueryOptions(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph(sourceId, fileId, pipelineId, executionId),
  });
}
