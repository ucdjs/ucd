import { CodeResponseSchema, type CodeResponse } from "../schemas/pipeline";
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
