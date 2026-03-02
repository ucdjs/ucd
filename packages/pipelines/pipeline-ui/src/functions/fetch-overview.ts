import type { OverviewResponse } from "../schemas/overview";
import { queryOptions } from "@tanstack/react-query";
import { OverviewResponseSchema } from "../schemas/overview";
import { fetchWithParse } from "./fetch-with-parse";

export async function fetchOverview(baseUrl: string): Promise<OverviewResponse> {
  return fetchWithParse(
    `${baseUrl}/api/sources/overview`,
    OverviewResponseSchema,
  );
}

export function overviewQueryOptions(baseUrl: string) {
  return queryOptions({
    queryKey: ["sources", "overview"],
    queryFn: () => fetchOverview(baseUrl),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
