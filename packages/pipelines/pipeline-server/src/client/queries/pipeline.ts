import type { PipelineDetails, PipelineInfo } from "#shared/schemas/pipeline";
import { PipelineDetailsSchema } from "#shared/schemas/pipeline";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export type { PipelineDetails, PipelineInfo };

export interface PipelineParams {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

export async function fetchPipeline({
  sourceId,
  fileId,
  pipelineId,
}: PipelineParams): Promise<PipelineDetails> {
  return (
    await customFetch<PipelineDetails>(`/api/sources/${sourceId}/files/${fileId}/pipelines/${pipelineId}`, {
      schema: PipelineDetailsSchema,
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
