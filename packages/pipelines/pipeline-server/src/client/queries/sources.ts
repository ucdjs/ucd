import type { SourceSummary } from "#shared/schemas/source";
import { SourcesResponseSchema } from "#shared/schemas/source";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export type { SourceSummary };

export async function fetchSources(): Promise<SourceSummary[]> {
  return (await customFetch<SourceSummary[]>("/api/sources", {
    schema: SourcesResponseSchema,
  })).data!;
}

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
    staleTime: 60_000,
  });
}
