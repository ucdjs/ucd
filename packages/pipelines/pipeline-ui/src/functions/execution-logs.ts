import type { ExecutionLogsResponse } from "../types";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { refetchWhileExecutionActive } from "./shared";

export type { ExecutionLogsResponse };

export interface ExecutionLogsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
}

export async function fetchExecutionLogs({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionLogsParams): Promise<ExecutionLogsResponse> {
  return (
    await customFetch<ExecutionLogsResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/logs`,
    )
  ).data!;
}

export function executionLogsQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionLogsParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs"],
    queryFn: () => fetchExecutionLogs({ sourceId, fileId, pipelineId, executionId }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => refetchWhileExecutionActive(query),
  });
}
