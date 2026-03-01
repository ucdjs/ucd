import type { ExecutionGraphResponse } from "../schemas/execution";
import { queryOptions } from "@tanstack/react-query";
import { ExecutionGraphResponseSchema } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecutionGraph(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionGraphResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/graph`,
    ExecutionGraphResponseSchema,
  );
}

export function executionGraphQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph(baseUrl, sourceId, fileId, pipelineId, executionId),
  });
}
