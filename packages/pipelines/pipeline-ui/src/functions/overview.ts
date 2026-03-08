import type { OverviewActivityDay, OverviewExecutionSummary, OverviewResponse } from "../schemas/overview";
import { queryOptions } from "@tanstack/react-query";
import { customFetch } from "@ucdjs-internal/shared";
import { OverviewResponseSchema } from "../schemas/overview";

export type {
  OverviewActivityDay,
  OverviewExecutionSummary,
  OverviewResponse,
};

export async function fetchOverview(): Promise<OverviewResponse> {
  return (await customFetch<OverviewResponse>("/api/overview", {
    schema: OverviewResponseSchema,
  })).data!;
}

export function overviewQueryOptions() {
  return queryOptions({
    queryKey: ["overview"],
    queryFn: fetchOverview,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
