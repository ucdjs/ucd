import type { ExecutionLogsResponse } from "../types";
import { queryOptions } from "@tanstack/react-query";

export type { ExecutionLogsResponse };

export async function fetchExecutionLogs(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionLogsResponse> {
  const res = await fetch(
    `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/logs`,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch execution logs: HTTP ${res.status}`);
  }
  return res.json();
}

export function executionLogsQueryOptions(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs"],
    queryFn: () => fetchExecutionLogs(sourceId, fileId, pipelineId, executionId),
  });
}
