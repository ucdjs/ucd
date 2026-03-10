import { ExecutionTable } from "#components/execution/execution-table";
import { QuickActionsCard } from "#components/overview/quick-actions-card";
import { executionsQueryOptions } from "#queries/execution";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

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
        <Card className="xl:col-span-8">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base">Recent executions</CardTitle>
            <CardDescription>Latest runs for this pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ExecutionTable
              executions={recentExecutions}
              emptyTitle="No executions yet"
              emptyDescription="Run the pipeline to build up execution history."
            />
          </CardContent>
        </Card>

        <QuickActionsCard versions={pipeline.versions} />
      </div>
    </div>
  );
}
