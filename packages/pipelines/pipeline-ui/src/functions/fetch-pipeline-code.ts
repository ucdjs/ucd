import type { CodeResponse } from "../schemas/pipeline";
import { queryOptions } from "@tanstack/react-query";
import { CodeResponseSchema } from "../schemas/pipeline";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchPipelineCode(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
): Promise<CodeResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/code`,
    CodeResponseSchema,
  );
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
