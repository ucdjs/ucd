/* eslint-disable react-refresh/only-export-components */

import { DashboardHome } from "#components/dashboard-home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { configQueryOptions, overviewQueryOptions, sourcesQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    return {
      overview: await context.queryClient.ensureQueryData(overviewQueryOptions()),
    };
  },
  component: HomePage,
});

function HomePage() {
  const { overview } = Route.useLoaderData();
  const { data: sources } = useSuspenseQuery(sourcesQueryOptions());
  const { data: config } = useSuspenseQuery(configQueryOptions({ baseUrl: "" }));

  return (
    <DashboardHome
      dashboard={overview}
      sources={sources}
      workspaceId={config.data?.workspaceId}
      version={config.data?.version}
    />
  );
}
