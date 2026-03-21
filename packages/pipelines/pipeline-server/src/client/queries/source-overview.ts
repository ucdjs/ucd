import type { OverviewResponse } from "#shared/schemas/overview";
import { OverviewResponseSchema } from "#shared/schemas/overview";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";

export async function fetchSourceOverview(sourceId: string): Promise<OverviewResponse> {
  return (await customFetch<OverviewResponse>(`/api/sources/${sourceId}/overview`, {
    schema: OverviewResponseSchema,
  })).data!;
}

export function sourceOverviewQueryOptions({ sourceId }: { sourceId: string }) {
  return queryOptions({
    queryKey: ["source-overview", sourceId],
    queryFn: () => fetchSourceOverview(sourceId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
