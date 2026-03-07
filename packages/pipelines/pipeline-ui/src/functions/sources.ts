import { queryOptions } from "@tanstack/react-query";

export interface SourceSummary {
  id: string;
  type: "local" | "github" | "gitlab";
  label: string;
  fileCount: number;
  pipelineCount: number;
  errors: Array<{ message: string; filePath?: string }>;
}

export interface SourcesResponse {
  sources: SourceSummary[];
}

export async function fetchSources(): Promise<SourcesResponse> {
  const res = await fetch("/api/sources");
  if (!res.ok) {
    throw new Error(`Failed to fetch sources: HTTP ${res.status}`);
  }
  return res.json();
}

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
  });
}
