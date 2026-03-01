import type { ExecutionEventsResponse, ExecutionLogsResponse } from "@ucdjs/pipelines-ui";

export async function fetchExecutionLogs(
  fileId: string,
  pipelineId: string,
  executionId: string,
  spanId?: string | null,
  sourceId?: string,
): Promise<ExecutionLogsResponse> {
  const params = new URLSearchParams({ limit: "500" });
  if (spanId) params.set("spanId", spanId);

  // Use new sources API if sourceId is provided, otherwise fall back to old pipelines API
  const endpoint = sourceId
    ? `/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/logs?${params.toString()}`
    : `/api/pipelines/${fileId}/${pipelineId}/executions/${executionId}/logs?${params.toString()}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to fetch execution logs");
  }
  return response.json();
}

export async function fetchExecutionEvents(
  fileId: string,
  pipelineId: string,
  executionId: string,
  sourceId?: string,
): Promise<ExecutionEventsResponse> {
  // Use new sources API if sourceId is provided, otherwise fall back to old pipelines API
  const endpoint = sourceId
    ? `/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/events?limit=500`
    : `/api/pipelines/${fileId}/${pipelineId}/executions/${executionId}/events?limit=500`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to fetch execution events");
  }
  return response.json();
}
