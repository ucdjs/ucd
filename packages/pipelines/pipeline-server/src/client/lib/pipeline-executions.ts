import type { ExecutionStatus } from "@ucdjs/pipelines-executor";

export type { ExecutionStatus };

export interface Execution {
  id: string;
  pipelineId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  versions: string[] | null;
  summary: {
    totalRoutes: number;
    cached: number;
  } | null;
  hasGraph?: boolean;
  error: string | null;
}

export interface ExecutionsResponse {
  executions: Execution[];
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
  fileId: string,
  pipelineId: string,
  options: FetchExecutionsOptions = {},
): Promise<ExecutionsResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(options.limit ?? 10));
  if (options.offset != null) {
    params.set("offset", String(options.offset));
  }

  const response = await fetch(
    `/api/pipelines/${fileId}/${pipelineId}/executions?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch executions");
  }
  return response.json();
}

export function formatDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = end - start;

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
}

export function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
