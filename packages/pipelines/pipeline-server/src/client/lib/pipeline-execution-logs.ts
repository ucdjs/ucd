import type { ExecutionEventsResponse, ExecutionLogsResponse } from "@ucdjs/pipelines-ui";

export async function fetchExecutionLogs(
  fileId: string,
  pipelineId: string,
  executionId: string,
  spanId?: string | null,
): Promise<ExecutionLogsResponse> {
  const params = new URLSearchParams({ limit: "500" });
  if (spanId) params.set("spanId", spanId);

  const response = await fetch(
    `/api/pipelines/${fileId}/${pipelineId}/executions/${executionId}/logs?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch execution logs");
  }
  return response.json();
}

export async function fetchExecutionEvents(
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionEventsResponse> {
  const response = await fetch(
    `/api/pipelines/${fileId}/${pipelineId}/executions/${executionId}/events?limit=500`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch execution events");
  }
  return response.json();
}
