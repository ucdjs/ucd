import type { ExecutionListResponse } from "../schemas/execution";
import { queryOptions } from "@tanstack/react-query";
import { ExecutionListResponseSchema } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecutions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  limit: number = 10,
): Promise<ExecutionListResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions?${params.toString()}`,
    ExecutionListResponseSchema,
  );
}

export function executionsQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  limit: number = 10,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", { limit }],
    queryFn: () => fetchExecutions(baseUrl, sourceId, fileId, pipelineId, limit),
  });
}
