import type { SourceFileResponse } from "../schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { SourceFileResponseSchema } from "../schemas/source";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchSourceFile(
  baseUrl: string,
  sourceId: string,
  fileId: string,
): Promise<SourceFileResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}/${fileId}`,
    SourceFileResponseSchema,
  );
}

export function sourceFileQueryOptions(baseUrl: string, sourceId: string, fileId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId, "files", fileId],
    queryFn: () => fetchSourceFile(baseUrl, sourceId, fileId),
  });
}
