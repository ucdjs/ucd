import type { WithBaseUrl } from "#lib/functions";
import type { CodeResponse, PipelineResponse } from "../schemas/pipeline";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { CodeResponseSchema, PipelineResponseSchema } from "../schemas/pipeline";

export interface FetchPipelineParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export async function fetchPipeline(options: WithBaseUrl<FetchPipelineParams>): Promise<PipelineResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId } = options;
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}`,
    {
      schema: PipelineResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch pipeline with id ${pipelineId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch pipeline with id ${pipelineId}: No data returned`);
  }

  return data;
}

export interface FetchPipelineCodeParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export async function fetchPipelineCode(options: WithBaseUrl<FetchPipelineCodeParams>): Promise<CodeResponse> {
  const { baseUrl = "", sourceId, fileId, pipelineId } = options;
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/code`,
    {
      schema: CodeResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch code for pipeline with id ${pipelineId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to fetch code for pipeline with id ${pipelineId}: No data returned`);
  }

  return data;
}

export interface PipelineQueryParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export function pipelineQueryOptions(options: WithBaseUrl<PipelineQueryParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId],
    queryFn: () => fetchPipeline({ baseUrl, sourceId, fileId, pipelineId }),
  });
}

export interface PipelineCodeQueryParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export function pipelineCodeQueryOptions(options: WithBaseUrl<PipelineCodeQueryParams>) {
  const { baseUrl = "", sourceId, fileId, pipelineId } = options;
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "code"],
    queryFn: () => fetchPipelineCode({ baseUrl, sourceId, fileId, pipelineId }),
  });
}
