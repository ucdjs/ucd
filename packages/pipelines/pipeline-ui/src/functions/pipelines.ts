import type { CodeResponse, PipelineResponse } from "../schemas/pipeline";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { CodeResponseSchema, PipelineResponseSchema } from "../schemas/pipeline";

export async function fetchPipeline(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
): Promise<PipelineResponse> {
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

export async function fetchPipelineCode(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
): Promise<CodeResponse> {
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

export function pipelineQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId],
    queryFn: () => fetchPipeline(baseUrl, sourceId, fileId, pipelineId),
  });
}

export function pipelineCodeQueryOptions(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId, "code"],
    queryFn: () => fetchPipelineCode(baseUrl, sourceId, fileId, pipelineId),
  });
}
