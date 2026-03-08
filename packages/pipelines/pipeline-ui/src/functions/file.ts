import type { SourceFileResponse } from "../schemas/file";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { SourceFileResponseSchema } from "../schemas/file";

export type { SourceFileResponse };

export interface SourceFileParams {
  sourceId: string;
  fileId: string;
}

export async function fetchSourceFile({ sourceId, fileId }: SourceFileParams): Promise<SourceFileResponse> {
  return (await customFetch<SourceFileResponse>(`/api/sources/${sourceId}/files/${fileId}`, {
    schema: SourceFileResponseSchema,
  })).data!;
}

export function sourceFileQueryOptions({ sourceId, fileId }: SourceFileParams) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: () => fetchSourceFile({ sourceId, fileId }),
    staleTime: 60_000,
  });
}
