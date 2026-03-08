import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { QuickActionsCard, RecentExecutionsCard } from "@ucdjs/pipelines-ui/components";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

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
