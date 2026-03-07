import type { ExecutionStatus, PipelineSummary } from "@ucdjs/pipelines-executor";
import { queryOptions } from "@tanstack/react-query";

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

export async function fetchExecutions(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  opts: FetchExecutionsOptions = {},
): Promise<ExecutionsResponse> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));

  const qs = params.toString();
  const url = `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions${qs ? `?${qs}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch executions: HTTP ${res.status}`);
  }
  return res.json();
}

export function executionsQueryOptions(
  sourceId: string,
  fileId: string,
  pipelineId: string,
  opts: FetchExecutionsOptions = {},
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", opts],
    queryFn: () => fetchExecutions(sourceId, fileId, pipelineId, opts),
  });
}
