import type { PipelineInfo } from "../types";
import { queryOptions } from "@tanstack/react-query";

export interface SourceFileResponse {
  id: string;
  path: string;
  label: string;
  sourceId: string;
  pipelines: PipelineInfo[];
}

export async function fetchSourceFile(sourceId: string, fileId: string): Promise<SourceFileResponse> {
  const res = await fetch(`/api/sources/${sourceId}/files/${fileId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch file "${fileId}": HTTP ${res.status}`);
  }
  return res.json();
}

export function sourceFileQueryOptions(sourceId: string, fileId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: () => fetchSourceFile(sourceId, fileId),
  });
}
