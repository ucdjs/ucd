import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { ExecutionsResponseSchema } from "../schemas/executions";
import type { ExecutionSummaryItem, ExecutionsResponse } from "../schemas/executions";

export type { ExecutionSummaryItem, ExecutionsResponse };

export interface FetchExecutionsOptions {
  limit?: number;
  offset?: number;
}

export interface ExecutionsParams extends FetchExecutionsOptions {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export async function fetchExecutions({
  sourceId,
  fileId,
  pipelineId,
  limit,
  offset,
}: ExecutionsParams): Promise<ExecutionsResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));

  const qs = params.toString();
  const url = `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions${qs ? `?${qs}` : ""}`;

  return (await customFetch<ExecutionsResponse>(url, {
    schema: ExecutionsResponseSchema,
  })).data!;
}

export function executionsQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  limit,
  offset,
}: ExecutionsParams) {
  const opts = { limit, offset };

  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", opts],
    queryFn: () => fetchExecutions({ sourceId, fileId, pipelineId, limit, offset }),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
}
