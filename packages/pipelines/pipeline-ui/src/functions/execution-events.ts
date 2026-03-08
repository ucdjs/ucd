import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import {
  ExecutionEventsResponseSchema,
  type ExecutionEventItem,
  type ExecutionEventsResponse,
} from "../schemas/execution-events";
import { refetchWhileExecutionActive } from "./shared";

export type { ExecutionEventItem, ExecutionEventsResponse };

export interface ExecutionEventsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
  offset?: number;
}

export async function fetchExecutionEvents({
  sourceId,
  fileId,
  pipelineId,
  executionId,
  limit,
  offset,
}: ExecutionEventsParams): Promise<ExecutionEventsResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString();

  return (
    await customFetch<ExecutionEventsResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/events${qs ? `?${qs}` : ""}`,
      {
        schema: ExecutionEventsResponseSchema,
      },
    )
  ).data!;
}

export function executionEventsQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  executionId,
  limit,
  offset,
}: ExecutionEventsParams) {
  const opts = { limit, offset };

  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events", opts],
    queryFn: () => fetchExecutionEvents({ sourceId, fileId, pipelineId, executionId, limit, offset }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => refetchWhileExecutionActive(query),
  });
}
