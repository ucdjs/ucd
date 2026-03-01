import type { ExecutionLogsResponse } from "../schemas/execution";
import { queryOptions } from "@tanstack/react-query";
import { ExecutionLogsResponseSchema } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecutionLogs(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
): Promise<ExecutionLogsResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/logs?${params.toString()}`,
    ExecutionLogsResponseSchema,
  );
}

export function executionLogsQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs", { limit }],
    queryFn: () => fetchExecutionLogs(baseUrl, sourceId, fileId, pipelineId, executionId, limit),
  });
}
