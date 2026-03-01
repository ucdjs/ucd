import type { ExecutionDetailResponse } from "../schemas/execution";
import { queryOptions } from "@tanstack/react-query";
import { ExecutionDetailResponseSchema } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecution(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionDetailResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}`,
    ExecutionDetailResponseSchema,
  );
}

export function executionQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId],
    queryFn: () => fetchExecution(baseUrl, sourceId, fileId, pipelineId, executionId),
  });
}
