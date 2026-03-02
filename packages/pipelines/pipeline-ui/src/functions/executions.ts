import type { ExecutionDetailResponse, ExecutionEventsResponse, ExecutionGraphResponse, ExecutionListResponse, ExecutionLogsResponse } from "../schemas/execution";
import type { ExecuteResult } from "../types";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import z from "zod";
import { ExecutionDetailResponseSchema, ExecutionEventsResponseSchema, ExecutionGraphResponseSchema, ExecutionListResponseSchema, ExecutionLogsResponseSchema } from "../schemas/execution";

export async function fetchExecutions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  limit: number = 10,
): Promise<ExecutionListResponse> {
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

export async function fetchExecution(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionDetailResponse> {
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

export async function fetchExecutionLogs(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
): Promise<ExecutionLogsResponse> {
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

export async function fetchExecutionGraph(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionGraphResponse> {
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

export async function executePipeline(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  versions: string[],
): Promise<ExecuteResult> {
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

export async function fetchExecutionEvents(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
): Promise<ExecutionEventsResponse> {
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

export function executionsQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  limit: number = 10,
  fetchOnMount: boolean = true,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", { limit }],
    queryFn: () => fetchExecutions(baseUrl, sourceId, fileId, pipelineId, limit),
    enabled: fetchOnMount,
  });
}

export function executionQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  fetchOnMount: boolean = true,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId],
    queryFn: () => fetchExecution(baseUrl, sourceId, fileId, pipelineId, executionId),
    enabled: fetchOnMount,
  });
}

export function executionLogsQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
  fetchOnMount: boolean = true,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "logs", { limit }],
    queryFn: () => fetchExecutionLogs(baseUrl, sourceId, fileId, pipelineId, executionId, limit),
    enabled: fetchOnMount,
  });
}

export function executionGraphQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  fetchOnMount: boolean = true,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "graph"],
    queryFn: () => fetchExecutionGraph(baseUrl, sourceId, fileId, pipelineId, executionId),
    enabled: fetchOnMount,
  });
}

export function executionEventsQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
  limit: number = 500,
  fetchOnMount: boolean = true,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "executions", executionId, "events", { limit }],
    queryFn: () => fetchExecutionEvents(baseUrl, sourceId, fileId, pipelineId, executionId, limit),
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
      executePipeline(baseUrl, params.sourceId, params.fileId, params.pipelineId, params.versions),
  });
}
