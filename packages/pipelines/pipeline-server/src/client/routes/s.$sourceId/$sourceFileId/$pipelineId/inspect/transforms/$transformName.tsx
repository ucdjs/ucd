import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { buttonVariants } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, FolderOutput, Link2, Package, Shuffle, Spline } from "lucide-react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName")({
  component: TransformDetailPage,
});

function TransformDetailPage() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { sourceId, sourceFileId, pipelineId, transformName } = Route.useParams();

  const transformRoutes = pipeline.routes.filter((route) => route.transforms.includes(transformName));

  const coTransforms = new Set<string>();
  for (const route of transformRoutes) {
    for (const t of route.transforms) {
      if (t !== transformName) coTransforms.add(t);
    }
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border/60 p-0">
        <div className="space-y-5 bg-muted/5 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/10">
                <Shuffle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{transformName}</h3>
                <Badge variant="secondary">
                  {transformRoutes.length}
                  {" "}
                  {transformRoutes.length === 1 ? "route" : "routes"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1">
                <Spline className="h-3 w-3" />
                <span className="font-semibold tabular-nums text-foreground">{transformRoutes.length}</span>
                {transformRoutes.length === 1 ? "route" : "routes"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1">
                <Link2 className="h-3 w-3" />
                <span className="font-semibold tabular-nums text-foreground">
                  {transformRoutes.reduce((sum, r) => sum + r.depends.length, 0)}
                </span>
                total depends
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1">
                <FolderOutput className="h-3 w-3" />
                <span className="font-semibold tabular-nums text-foreground">
                  {transformRoutes.reduce((sum, r) => sum + r.outputs.length, 0)}
                </span>
                total outputs
              </span>
            </div>
          </div>

          {coTransforms.size > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-4">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Also used with</div>
              <div className="flex flex-wrap gap-1.5">
                {[...coTransforms].toSorted().map((name) => (
                  <Link
                    key={name}
                    to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName"
                    params={{ sourceId, sourceFileId, pipelineId, transformName: name }}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Shuffle className="h-3 w-3" />
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {transformRoutes.map((route) => {
          const stepIndex = route.transforms.indexOf(transformName);
          return (
            <div key={route.id} className="space-y-3 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{route.id}</span>
                    {route.cache && <Badge variant="secondary" className="text-[10px]">Cacheable</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      <span className="font-medium tabular-nums text-foreground/70">{route.depends.length}</span>
                      {" "}
                      depends
                    </span>
                    <span>
                      <span className="font-medium tabular-nums text-foreground/70">{route.transforms.length}</span>
                      {" "}
                      transforms
                    </span>
                    <span>
                      <span className="font-medium tabular-nums text-foreground/70">{route.outputs.length}</span>
                      {" "}
                      outputs
                    </span>
                  </div>
                </div>
                <Link
                  to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId"
                  params={{ sourceId, sourceFileId, pipelineId, routeId: route.id }}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Route
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {route.filter && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Filter</div>
                  <code className="block rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs">{route.filter}</code>
                </div>
              )}

              {route.transforms.length > 1 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Transform chain</div>
                  <div className="flex flex-wrap items-center gap-1">
                    {route.transforms.map((t, i) => (
                      <span key={t} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[10px] text-muted-foreground/50">&rarr;</span>}
                        {t === transformName
                          ? (
                              <span className="rounded-md bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground">
                                {stepIndex + 1}
                                .
                                {" "}
                                {t}
                              </span>
                            )
                          : (
                              <Link
                                to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName"
                                params={{ sourceId, sourceFileId, pipelineId, transformName: t }}
                                className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                {i + 1}
                                .
                                {" "}
                                {t}
                              </Link>
                            )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {route.depends.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Dependencies</div>
                  <div className="flex flex-wrap gap-1.5">
                    {route.depends.map((dep) => (
                      dep.type === "route"
                        ? (
                            <Link
                              key={`route-${dep.routeId}`}
                              to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId"
                              params={{ sourceId, sourceFileId, pipelineId, routeId: dep.routeId }}
                              className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              <Spline className="h-3 w-3" />
                              {dep.routeId}
                            </Link>
                          )
                        : (
                            <span key={`artifact-${dep.routeId}-${dep.artifactName}`} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground">
                              <Package className="h-3 w-3" />
                              {dep.routeId}
                              :
                              {dep.artifactName}
                            </span>
                          )
                    ))}
                  </div>
                </div>
              )}

              {route.emits.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Emits</div>
                  <div className="flex flex-wrap gap-1.5">
                    {route.emits.map((emit) => (
                      <Badge key={emit.id} variant="secondary" className="text-xs">
                        <Package className="h-3 w-3" />
                        {emit.id}
                        {" "}
                        <span className="text-[10px] opacity-70">{emit.scope}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {route.outputs.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Outputs</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {route.outputs.map((output, idx) => (
                      <Link
                        key={`${output.dir ?? "none"}-${output.fileName ?? "none"}`}
                        to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/$outputKey"
                        params={{ sourceId, sourceFileId, pipelineId, outputKey: `${route.id}:${idx}` }}
                        className="rounded-lg border border-border/60 px-3 py-2 hover:bg-accent/50"
                      >
                        <div className="truncate text-xs font-medium text-foreground">{output.fileName ?? "Generated"}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{output.dir ?? "Default directory"}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
