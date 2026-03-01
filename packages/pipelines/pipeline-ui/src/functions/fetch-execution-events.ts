import type { ExecutionEventsResponse } from "../schemas/execution";
import { ExecutionEventsResponseSchema } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecutionEvents(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
): Promise<ExecutionEventsResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/events?${params.toString()}`,
    ExecutionEventsResponseSchema,
  );
}
