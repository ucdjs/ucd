import { ExecutionGraphResponseSchema, type ExecutionGraphResponse } from "../schemas/execution";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchExecutionGraph(
  baseUrl: string,
  sourceId: string,
  fileId: string,
  pipelineId: string,
  executionId: string,
): Promise<ExecutionGraphResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}/${pipelineId}/executions/${executionId}/graph`,
    ExecutionGraphResponseSchema,
  );
}
