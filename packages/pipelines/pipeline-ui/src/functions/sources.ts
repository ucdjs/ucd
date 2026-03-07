import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export interface SourceSummary {
  id: string;
  type: "local" | "github" | "gitlab";
  label: string;
  fileCount: number;
  pipelineCount: number;
  errors: Array<{
    code: string;
    scope: string;
    message: string;
    filePath?: string;
    relativePath?: string;
    meta?: Record<string, unknown>;
  }>;
}

export async function fetchSources(): Promise<SourceSummary[]> {
  return (await customFetch<SourceSummary[]>("/api/sources")).data!;
}

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
    staleTime: 60_000,
  });
}
