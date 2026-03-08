import type { SourceFileInfo, SourceResponse, SourceType } from "#shared/schemas/source";
import { SourceResponseSchema } from "#shared/schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export type { SourceFileInfo, SourceResponse, SourceType };

export interface SourceFilePipelineSummary {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
}

export interface SourceParams {
  sourceId: string;
}

export async function fetchSource({ sourceId }: SourceParams): Promise<SourceResponse> {
  return (await customFetch<SourceResponse>(`/api/sources/${sourceId}`, {
    schema: SourceResponseSchema,
  })).data!;
}

export function sourceQueryOptions({ sourceId }: SourceParams) {
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: () => fetchSource({ sourceId }),
    staleTime: 60_000,
  });
}
