import { queryOptions } from "@tanstack/react-query";

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
  pipelines: SourceFilePipelineSummary[];
}

export interface SourceResponse {
  id: string;
  type: "local" | "github" | "gitlab";
  label: string;
  files: SourceFileInfo[];
  errors: Array<{ message: string; filePath?: string }>;
}

export async function fetchSource(sourceId: string): Promise<SourceResponse> {
  const res = await fetch(`/api/sources/${sourceId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch source "${sourceId}": HTTP ${res.status}`);
  }
  return res.json();
}

export function sourceQueryOptions(sourceId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: () => fetchSource(sourceId),
  });
}
