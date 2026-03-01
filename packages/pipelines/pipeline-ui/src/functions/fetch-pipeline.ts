import type { PipelineResponse } from "../schemas/pipeline";
import { queryOptions } from "@tanstack/react-query";
import { PipelineResponseSchema } from "../schemas/pipeline";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchPipeline(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
): Promise<PipelineResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}`,
    PipelineResponseSchema,
  );
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
