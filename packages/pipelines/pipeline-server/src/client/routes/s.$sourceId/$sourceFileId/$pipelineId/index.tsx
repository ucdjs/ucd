import { QuickActionsCard } from "#components/overview/quick-actions-card";
import { RecentExecutionsCard } from "#components/overview/recent-executions-card";
import { executionsQueryOptions } from "#queries/execution";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";

const ParentRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/")({
  loader: async ({ context, params }) => {
    return {
      executions: await context.queryClient.ensureQueryData(executionsQueryOptions({
        sourceId: params.sourceId,
        fileId: params.sourceFileId,
        pipelineId: params.pipelineId,
        limit: 6,
      })),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { executions: executionsData } = Route.useLoaderData();
  const { pipelineResponse } = ParentRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const recentExecutions = executionsData.executions;

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="p-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <RecentExecutionsCard executions={recentExecutions} />

        <QuickActionsCard versions={pipeline.versions} />
      </div>
    </div>
  );
}
