import type { PipelineGraph } from "@ucdjs/pipelines-core";
import type { ExecutionStatus } from "@ucdjs/pipelines-executor";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { refetchWhileExecutionActive } from "./shared";

export interface ExecutionGraphResponse {
  executionId: string;
  pipelineId: string;
  status: ExecutionStatus;
  graph: PipelineGraph | null;
}

export interface ExecutionGraphParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
}

export async function fetchExecutionGraph({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionGraphParams): Promise<ExecutionGraphResponse> {
  return (
    await customFetch<ExecutionGraphResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/graph`,
    )
  ).data!;
}

export function executionGraphQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionGraphParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph({ sourceId, fileId, pipelineId, executionId }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => refetchWhileExecutionActive(query),
  });
}
