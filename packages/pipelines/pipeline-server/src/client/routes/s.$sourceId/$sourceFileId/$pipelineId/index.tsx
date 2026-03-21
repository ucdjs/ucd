import { ExecutionTable } from "#components/execution/execution-table";
import { QuickActionsCard } from "#components/pipeline/quick-actions-card";
import { executionsQueryOptions } from "#queries/execution";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { FolderOutput, Layers3, Link2, Package, Shuffle, Spline } from "lucide-react";

const ParentRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(executionsQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
      limit: 12,
    }));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { pipelineResponse } = ParentRoute.useLoaderData();
  const { data: executionsData } = useSuspenseQuery(executionsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    limit: 12,
  }));
  const pipeline = pipelineResponse.pipeline;
  const recentExecutions = executionsData.executions;
  const cachedRouteCount = pipeline.routes.filter((route) => route.cache).length;
  const emittedArtifactCount = pipeline.routes.reduce((count, route) => count + route.emits.length, 0);
  const transformCount = pipeline.routes.reduce((count, route) => count + route.transforms.length, 0);
  const outputCount = pipeline.routes.reduce((count, route) => count + route.outputs.length, 0);
  const busiestRoutes = pipeline.routes.toSorted((left, right) => {
    const leftScore = left.depends.length + left.transforms.length + left.emits.length;
    const rightScore = right.depends.length + right.transforms.length + right.emits.length;

    return rightScore - leftScore;
  })
    .slice(0, 3);

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="p-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8 rounded-xl border border-border/60 bg-background">
          <header className="border-b border-border/60 px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">Recent executions</h2>
            <p className="text-sm text-muted-foreground">Latest runs for this pipeline.</p>
          </header>
          <ExecutionTable
            executions={recentExecutions}
            emptyTitle="No executions yet"
            emptyDescription="Run the pipeline to build up execution history."
          />
        </section>

        <div className="grid gap-6 xl:col-span-4 xl:self-start">
          <QuickActionsCard versions={pipeline.versions} />

          <section className="space-y-5 rounded-xl border border-border/60 bg-muted/10 p-5">
            <header className="space-y-1">
              <h2 className="text-base font-semibold tracking-tight">Pipeline at a glance</h2>
              <p className="text-sm text-muted-foreground">Definition shape and route activity.</p>
            </header>
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <Layers3 className="h-4 w-4 text-muted-foreground" />
                  <div className="text-lg font-semibold tabular-nums">{pipeline.versions.length}</div>
                  <span className="text-xs text-muted-foreground">versions</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <Spline className="h-4 w-4 text-muted-foreground" />
                  <div className="text-lg font-semibold tabular-nums">{cachedRouteCount}</div>
                  <span className="text-xs text-muted-foreground">cached routes</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="text-lg font-semibold tabular-nums">{emittedArtifactCount}</div>
                  <span className="text-xs text-muted-foreground">emits</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <FolderOutput className="h-4 w-4 text-muted-foreground" />
                  <div className="text-lg font-semibold tabular-nums">{outputCount}</div>
                  <span className="text-xs text-muted-foreground">outputs</span>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">Busiest routes</h3>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shuffle className="h-3 w-3" />
                    {transformCount}
                    {" "}
                    transforms total
                  </span>
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
                              <div className="flex min-w-0 items-center gap-2">
                                <Spline className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <div className="truncate text-sm font-medium">{route.id}</div>
                              </div>
                              {route.cache
                                ? <Badge variant="secondary">cached</Badge>
                                : <Badge variant="outline">live</Badge>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {route.emits.length}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                {route.depends.length}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Shuffle className="h-3 w-3" />
                                {route.transforms.length}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  : <div className="text-sm text-muted-foreground">No routes defined.</div>}
              </section>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
