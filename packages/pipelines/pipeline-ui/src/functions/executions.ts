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

export interface PipelineParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
  limit?: number;
}

export interface ExecutionParams extends PipelineParams {
  executionId: string;
}

export interface ExecutePipelineParams extends PipelineParams {
  versions: string[];
}

export async function fetchExecutions(options: WithBaseUrl<PipelineParams>): Promise<ExecutionListResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId, limit = 10 } = options;
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

export async function fetchExecution(options: WithBaseUrl<ExecutionParams>): Promise<ExecutionDetailResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId } = options;

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

export async function fetchExecutionLogs(options: WithBaseUrl<ExecutionParams>): Promise<ExecutionLogsResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId, limit = 500 } = options;
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

export async function fetchExecutionGraph(options: WithBaseUrl<ExecutionParams>): Promise<ExecutionGraphResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId } = options;
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

export async function executePipeline(options: WithBaseUrl<ExecutePipelineParams>): Promise<ExecuteResult> {
  const { baseUrl = "", sourceId, fileId, pipelineId, versions } = options;
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

export async function fetchExecutionEvents(options: WithBaseUrl<ExecutionParams>): Promise<ExecutionEventsResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId, limit = 500 } = options;
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

export function executionsQueryOptions(options: WithBaseUrl<PipelineParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId, limit } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", { limit }],
    queryFn: () => fetchExecutions({ baseUrl, sourceId, fileId, pipelineId, limit }),
  });
}

export function executionQueryOptions(options: WithBaseUrl<ExecutionParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId],
    queryFn: () => fetchExecution({ baseUrl, sourceId, fileId, pipelineId, executionId }),
  });
}

export function executionLogsQueryOptions(options: WithBaseUrl<ExecutionParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId, limit = 500 } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs", { limit }],
    queryFn: () => fetchExecutionLogs({ baseUrl, sourceId, fileId, pipelineId, executionId, limit }),
  });
}

export function executionGraphQueryOptions(options: WithBaseUrl<ExecutionParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph({ baseUrl, sourceId, fileId, pipelineId, executionId }),
  });
}

export function executionEventsQueryOptions(options: WithBaseUrl<ExecutionParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId, executionId, limit = 500 } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events", { limit }],
    queryFn: () => fetchExecutionEvents({ baseUrl, sourceId, fileId, pipelineId, executionId, limit }),
  });
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
