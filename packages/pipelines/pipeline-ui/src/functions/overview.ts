import type { OverviewResponse } from "../schemas/overview";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { OverviewResponseSchema } from "../schemas/overview";

export async function fetchOverview(baseUrl: string): Promise<OverviewResponse> {
  const { data, error } = await customFetch.safe(
    `${baseUrl}/api/sources/overview`,
    {
      schema: OverviewResponseSchema,
    },
  );

  if (error) {
    throw new Error(`Failed to fetch overview: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to fetch overview: No data returned");
  }

  return data;
}

export function overviewQueryOptions(baseUrl: string, fetchOnMount: boolean = true) {
  return queryOptions({
    queryKey: ["sources", "overview"],
    queryFn: () => fetchOverview(baseUrl),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    enabled: fetchOnMount,
  });
}
