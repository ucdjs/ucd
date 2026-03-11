import type {
  ExecutePipelineResponse,
  ExecutionEventsResponse,
  ExecutionGraphResponse,
  ExecutionLogsResponse,
  ExecutionsResponse,
  ExecutionSummaryItem,
} from "#shared/schemas/execution";
import type { ExecuteResult } from "#shared/types";
import type { QueryClient } from "@tanstack/react-query";
import {
  ExecutePipelineResponseSchema,
  ExecutionEventsResponseSchema,
  ExecutionGraphResponseSchema,
  ExecutionLogsResponseSchema,
  ExecutionsResponseSchema,
} from "#shared/schemas/execution";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { refetchWhileExecutionActive } from "./utils";

export type {
  ExecutePipelineResponse,
  ExecutionEventsResponse,
  ExecutionGraphResponse,
  ExecutionLogsResponse,
  ExecutionsResponse,
  ExecutionSummaryItem,
};

interface ExecutePipelineRequest {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  versions: string[];
  cache?: boolean;
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

export interface ExecutionEventsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
  offset?: number;
}

export interface ExecutionLogsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
  offset?: number;
  spanId?: string;
}

export interface ExecutionGraphParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
}

export async function executePipeline({
  sourceId,
  fileId,
  pipelineId,
  versions,
  cache,
}: ExecutePipelineRequest): Promise<ExecuteResult> {
  const data = (
    await customFetch<ExecutePipelineResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/execute`,
      {
        method: "POST",
        body: { versions, cache },
        schema: ExecutePipelineResponseSchema,
      },
    )
  ).data!;

  if (data.success && data.executionId) {
    return {
      success: true,
      pipelineId,
      executionId: data.executionId,
    };
  }

  return {
    success: false,
    pipelineId,
    executionId: data.executionId,
    error: data.error ?? "Execution failed",
  };
}

export function executePipelineMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: executePipeline,
    onSuccess: async (_result, variables) => {
      const { sourceId, fileId, pipelineId } = variables;
      const baseKey = ["sources", sourceId, "files", fileId, "pipelines", pipelineId] as const;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...baseKey, "executions"] }),
        queryClient.invalidateQueries({ queryKey: baseKey }),
      ]);
    },
  });
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
      {
        schema: ExecutionLogsResponseSchema,
      },
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

export async function fetchExecutionGraph({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionGraphParams): Promise<ExecutionGraphResponse> {
  return (
    await customFetch<ExecutionGraphResponse>(
      `/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}/executions/${executionId}/graph`,
      {
        schema: ExecutionGraphResponseSchema,
      },
    )
  ).data!;
}

export function executionGraphQueryOptions({
  sourceId,
  fileId,
  pipelineId,
  executionId,
}: ExecutionGraphParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph({ sourceId, fileId, pipelineId, executionId }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => refetchWhileExecutionActive(query),
  });
}
