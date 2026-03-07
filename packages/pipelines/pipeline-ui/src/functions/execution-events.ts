import type { ExecutionEventItem, ExecutionEventsResponse } from "../types";
import { queryOptions } from "@tanstack/react-query";

export type { ExecutionEventItem, ExecutionEventsResponse };

export async function fetchExecutionEvents(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionEventsResponse> {
  const res = await fetch(
    `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/events`,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch execution events: HTTP ${res.status}`);
  }
  return res.json();
}

export function executionEventsQueryOptions(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events"],
    queryFn: () => fetchExecutionEvents(sourceId, fileId, pipelineId, executionId),
  });
}
