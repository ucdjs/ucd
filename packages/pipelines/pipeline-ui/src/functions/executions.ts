import type { WithBaseUrl } from "#lib/functions";
import type { ExecutionDetailResponse, ExecutionEventsResponse, ExecutionGraphResponse, ExecutionListResponse, ExecutionLogsResponse } from "../schemas/execution";
import type { ExecuteResult } from "../types";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import z from "zod";
import {
  ExecutionDetailResponseSchema,
  ExecutionEventsResponseSchema,
  ExecutionGraphResponseSchema,
  ExecutionListResponseSchema,
  ExecutionLogsResponseSchema,
} from "../schemas/execution";

export interface FetchExecutionsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  limit?: number;
}

export async function fetchExecutions(options: WithBaseUrl<FetchExecutionsParams>): Promise<ExecutionListResponse> {
  const { baseUrl, sourceId, fileId, pipelineId, limit = 10 } = options;
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions?${params.toString()}`,
    {
      schema: ExecutionListResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch executions for pipeline with id ${pipelineId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch executions for pipeline with id ${pipelineId}: No data returned`);
  }

  return data;
}

export interface FetchExecutionParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
}

export async function fetchExecution(options: WithBaseUrl<FetchExecutionParams>): Promise<ExecutionDetailResponse> {
  const { baseUrl, sourceId, fileId, pipelineId, executionId } = options;

  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}`,
    {
      schema: ExecutionDetailResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch execution with id ${executionId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch execution with id ${executionId}: No data returned`);
  }

  return data;
}

export interface FetchExecutionLogsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
}

export async function fetchExecutionLogs(options: WithBaseUrl<FetchExecutionLogsParams>): Promise<ExecutionLogsResponse> {
  const { baseUrl, sourceId, fileId, pipelineId, executionId, limit = 500 } = options;
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/logs?${params.toString()}`,
    {
      schema: ExecutionLogsResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch logs for execution with id ${executionId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch logs for execution with id ${executionId}: No data returned`);
  }

  return data;
}

export interface FetchExecutionGraphParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
}

export async function fetchExecutionGraph(options: WithBaseUrl<FetchExecutionGraphParams>): Promise<ExecutionGraphResponse> {
  const { baseUrl, sourceId, fileId, pipelineId, executionId } = options;
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/graph`,
    {
      schema: ExecutionGraphResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch execution graph for execution with id ${executionId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch execution graph for execution with id ${executionId}: No data returned`);
  }

  return data;
}

export const ExecuteResponseSchema = z.object({
  success: z.boolean(),
  executionId: z.string().optional(),
  error: z.string().optional(),
});

export interface ExecutePipelineParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  versions: string[];
}

export async function executePipeline(options: WithBaseUrl<ExecutePipelineParams>): Promise<ExecuteResult> {
  const { baseUrl, sourceId, fileId, pipelineId, versions } = options;
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/execute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versions }),
      schema: ExecuteResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to execute pipeline with id ${pipelineId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to execute pipeline with id ${pipelineId}: No data returned`);
  }

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

export interface FetchExecutionEventsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
}

export async function fetchExecutionEvents(options: WithBaseUrl<FetchExecutionEventsParams>): Promise<ExecutionEventsResponse> {
  const { baseUrl, sourceId, fileId, pipelineId, executionId, limit = 500 } = options;
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/events?${params.toString()}`,
    {
      schema: ExecutionEventsResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch execution events for execution with id ${executionId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch execution events for execution with id ${executionId}: No data returned`);
  }

  return data;
}

export interface ExecutionsParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  limit?: number;
  fetchOnMount?: boolean;
}

export function executionsQueryOptions(options: WithBaseUrl<ExecutionsParams>) {
  const { baseUrl, sourceId, fileId, pipelineId, limit, fetchOnMount } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", { limit }],
    queryFn: () => fetchExecutions({ baseUrl, sourceId, fileId, pipelineId, limit }),
    enabled: fetchOnMount,
  });
}

export interface ExecutionQueryParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  fetchOnMount?: boolean;
}

export function executionQueryOptions(options: WithBaseUrl<ExecutionQueryParams>) {
  const { baseUrl, sourceId, fileId, pipelineId, executionId, fetchOnMount } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId],
    queryFn: () => fetchExecution({ baseUrl, sourceId, fileId, pipelineId, executionId }),
    enabled: fetchOnMount,
  });
}

export interface ExecutionLogsQueryParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
  fetchOnMount?: boolean;
}

export function executionLogsQueryOptions(options: WithBaseUrl<ExecutionLogsQueryParams>) {
  const { baseUrl, sourceId, fileId, pipelineId, executionId, limit = 500, fetchOnMount = true } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs", { limit }],
    queryFn: () => fetchExecutionLogs({ baseUrl, sourceId, fileId, pipelineId, executionId, limit }),
    enabled: fetchOnMount,
  });
}

export interface ExecutionGraphQueryParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  fetchOnMount?: boolean;
}

export function executionGraphQueryOptions(options: WithBaseUrl<ExecutionGraphQueryParams>) {
  const { baseUrl, sourceId, fileId, pipelineId, executionId, fetchOnMount = true } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph({ baseUrl, sourceId, fileId, pipelineId, executionId }),
    enabled: fetchOnMount,
  });
}

export interface ExecutionEventsQueryParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  executionId: string;
  limit?: number;
  fetchOnMount?: boolean;
}

export function executionEventsQueryOptions(options: WithBaseUrl<ExecutionEventsQueryParams>) {
  const { baseUrl, sourceId, fileId, pipelineId, executionId, limit = 500, fetchOnMount = true } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events", { limit }],
    queryFn: () => fetchExecutionEvents({ baseUrl, sourceId, fileId, pipelineId, executionId, limit }),
    enabled: fetchOnMount,
  });
}

export interface ExecutePipelineParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  versions: string[];
}

export function executePipelineMutationOptions(baseUrl: string) {
  return mutationOptions({
    mutationFn: (params: ExecutePipelineParams) =>
      executePipeline({
        baseUrl,
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
        versions: params.versions,
      }),
  });
}
