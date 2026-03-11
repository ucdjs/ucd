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
  const cachedRouteCount = pipeline.routes.filter((route) => route.cache).length;
  const emittedArtifactCount = pipeline.routes.reduce((count, route) => count + route.emits.length, 0);
  const transformCount = pipeline.routes.reduce((count, route) => count + route.transforms.length, 0);
  const outputCount = pipeline.routes.reduce((count, route) => count + route.outputs.length, 0);
  const busiestRoutes = [...pipeline.routes]
    .sort((left, right) => {
      const leftScore = left.depends.length + left.transforms.length + left.emits.length;
      const rightScore = right.depends.length + right.transforms.length + right.emits.length;

      return rightScore - leftScore;
    })
    .slice(0, 3);

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

        <div className="grid gap-6 xl:col-span-4 xl:self-start">
          <QuickActionsCard versions={pipeline.versions} />

          <Card>
            <CardHeader>
              <CardTitle>Pipeline at a glance</CardTitle>
              <CardDescription>Definition shape and route activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Versions</div>
                  <div className="mt-1 text-2xl font-semibold">{pipeline.versions.length}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Cached routes</div>
                  <div className="mt-1 text-2xl font-semibold">{cachedRouteCount}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Emitted artifacts</div>
                  <div className="mt-1 text-2xl font-semibold">{emittedArtifactCount}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Outputs</div>
                  <div className="mt-1 text-2xl font-semibold">{outputCount}</div>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">Busiest routes</h3>
                  <span className="text-xs text-muted-foreground">{transformCount} transforms total</span>
                </div>

                {busiestRoutes.length > 0
                  ? (
                      <div className="space-y-2">
                        {busiestRoutes.map((route) => (
                          <div
                            key={route.id}
                            className="rounded-lg border border-border/60 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="truncate text-sm font-medium">{route.id}</div>
                              <div className="text-xs text-muted-foreground">
                                {route.cache ? "cached" : "live"}
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {route.depends.length}
                              {" "}
                              deps
                              {" · "}
                              {route.transforms.length}
                              {" "}
                              transforms
                              {" · "}
                              {route.emits.length}
                              {" "}
                              emits
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  : <div className="text-sm text-muted-foreground">No routes defined.</div>}
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
