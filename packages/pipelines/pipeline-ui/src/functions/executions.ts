import type { ExecutionStatus, PipelineSummary } from "@ucdjs/pipelines-executor";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export interface ExecutionSummaryItem {
  id: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  versions: string[] | null;
  summary: PipelineSummary | null;
  hasGraph: boolean;
  error: string | null;
}

export interface ExecutionsResponse {
  executions: ExecutionSummaryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

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

  return (await customFetch<ExecutionsResponse>(url)).data!;
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
