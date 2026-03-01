import type { SourceDetail } from "../schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { SourceDetailSchema } from "../schemas/source";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchSource(
  baseUrl: string,
  sourceId: string,
): Promise<SourceDetail> {
  return fetchWithParse(
    `${baseUrl}/api/sources/${sourceId}`,
    SourceDetailSchema,
  );
}

export function sourceQueryOptions(baseUrl: string, sourceId: string) {
  return queryOptions({
    queryKey: ["sources", sourceId],
    queryFn: () => fetchSource(baseUrl, sourceId),
  });
}
