import type { PipelineResponse } from "../schemas/pipeline";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { PipelineResponseSchema } from "../schemas/pipeline";

export type { PipelineResponse };

export interface PipelineParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export async function fetchPipeline({
  sourceId,
  fileId,
  pipelineId,
}: PipelineParams): Promise<PipelineResponse> {
  return (
    await customFetch<PipelineResponse>(`/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}`, {
      schema: PipelineResponseSchema,
    })
  ).data!;
}

export function pipelineQueryOptions({ sourceId, fileId, pipelineId }: PipelineParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId, "pipelines", pipelineId],
    queryFn: () => fetchPipeline({ sourceId, fileId, pipelineId }),
    staleTime: 60_000,
  });
}
