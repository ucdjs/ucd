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
  limit?: number;
  offset?: number;
  spanId?: string;
}

export async function fetchExecutionLogs({
  sourceId,
  fileId,
  pipelineId,
  executionId,
  limit,
  offset,
  spanId,
}: ExecutionLogsParams): Promise<ExecutionLogsResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  if (spanId) params.set("spanId", spanId);
  const qs = params.toString();

  return (
    await customFetch<ExecutionLogsResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/logs${qs ? `?${qs}` : ""}`,
    )
  ).data!;
}

export function executionLogsQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  executionId,
  limit,
  offset,
  spanId,
}: ExecutionLogsParams) {
  const opts = { limit, offset, spanId };

  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs", opts],
    queryFn: () => fetchExecutionLogs({ sourceId, fileId, pipelineId, executionId, limit, offset, spanId }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => refetchWhileExecutionActive(query),
  });
}
