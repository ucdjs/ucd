import { PipelineResponseSchema, type PipelineResponse } from "../schemas/pipeline";
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
