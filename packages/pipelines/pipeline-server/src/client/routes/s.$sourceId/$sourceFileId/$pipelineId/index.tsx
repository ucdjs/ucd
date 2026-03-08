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

        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Route overview</CardTitle>
            <CardDescription>
              {pipeline.routes.length}
              {" "}
              configured routes
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {pipeline.routes.slice(0, 6).map((route) => (
              <div key={route.id} className="rounded-xl border border-border px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{route.id}</span>
                  {route.cache
                    ? <Badge variant="secondary">cache</Badge>
                    : <Badge variant="outline">live</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4 xl:self-start">
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>
              {pipeline.sources.length}
              {" "}
              linked source
              {pipeline.sources.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {pipeline.sources.map((source) => (
              <div key={source.id} className="rounded-xl border border-border px-3 py-3 text-sm">
                <code>{source.id}</code>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
