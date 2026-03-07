import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export interface SourceFilePipelineSummary {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
}

export interface SourceFileInfo {
  id: string;
  path: string;
  label: string;
}

export interface SourceResponse {
  id: string;
  type: "local" | "github" | "gitlab";
  label: string;
  files: SourceFileInfo[];
  errors: Array<{
    code: string;
    scope: string;
    message: string;
    filePath?: string;
    relativePath?: string;
    meta?: Record<string, unknown>;
  }>;
}

export interface SourceParams {
  sourceId: string;
}

export async function fetchSource({ sourceId }: SourceParams): Promise<SourceResponse> {
  return (await customFetch<SourceResponse>(`/api/sources/${sourceId}`)).data!;
}

export function sourceQueryOptions({ sourceId }: SourceParams) {
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: () => fetchSource({ sourceId }),
    staleTime: 60_000,
  });
}
