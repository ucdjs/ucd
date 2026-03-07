import type { ExecutionEventItem, ExecutionEventsResponse } from "../types";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { refetchWhileExecutionActive } from "./shared";

export type { ExecutionEventItem, ExecutionEventsResponse };

export interface ExecutionEventsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
}

export async function fetchExecutionEvents({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionEventsParams): Promise<ExecutionEventsResponse> {
  return (
    await customFetch<ExecutionEventsResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/events`,
    )
  ).data!;
}

export function executionEventsQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionEventsParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events"],
    queryFn: () => fetchExecutionEvents({ sourceId, fileId, pipelineId, executionId }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => refetchWhileExecutionActive(query),
  });
}
