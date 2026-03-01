import type { SourceList } from "../schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { SourceListSchema } from "../schemas/source";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchSources(baseUrl: string): Promise<SourceList> {
  return fetchWithParse(
    `${baseUrl}/api/sources`,
    SourceListSchema,
  );
}

export function sourcesQueryOptions(baseUrl: string) {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: () => fetchSources(baseUrl),
  });
}
