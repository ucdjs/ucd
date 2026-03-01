import { ExecutionDetailResponseSchema, type ExecutionDetailResponse } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecution(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionDetailResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}`,
    ExecutionDetailResponseSchema,
  );
}
