import { Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, Boxes, FolderTree, Layers3 } from "lucide-react";
import { RouteStructureMetrics } from "./route-structure-metrics";

export interface PipelineStructureRouteItem {
  id: string;
  cache: boolean;
  dependsAmount: number;
  transforms: string[];
  outputsAmount: number;
}

export interface PipelineStructureProps {
  routes: number;
  dependencies: number;
  transforms: number;
  outputs: number;
  versions: number;
  cacheableRoutes: number;
  inspectRoutes: PipelineStructureRouteItem[];
}

export function PipelineStructure({
  routes,
  dependencies,
  transforms,
  outputs,
  versions,
  cacheableRoutes,
  inspectRoutes,
}: PipelineStructureProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  return (
    <Card className="xl:col-span-12 2xl:col-span-16">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle>Pipeline structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <section className="rounded-lg border border-border/60 p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem] md:items-center">
            <RouteStructureMetrics
              routes={routes}
              dependencies={dependencies}
              transforms={transforms}
              outputs={outputs}
              compact
            />
            <div className="space-y-1 md:border-l md:border-border/60 md:pl-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Versions</div>
              <div className="text-2xl font-semibold leading-none text-foreground">{versions}</div>
            </div>
            <div className="space-y-1 md:border-l md:border-border/60 md:pl-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Cacheable routes</div>
              <div className="text-2xl font-semibold leading-none text-foreground">{cacheableRoutes}</div>
            </div>
          </div>
        </section>

        <section>
          {inspectRoutes.length > 0
            ? (
                <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                  {inspectRoutes.map((route) => {
                    const visibleTransforms = route.transforms.slice(0, 2);
                    const hiddenTransforms = route.transforms.length - visibleTransforms.length;

                    return (
                      <Link
                        key={route.id}
                        to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
                        params={{ sourceId, sourceFileId, pipelineId }}
                        search={{ q: undefined, route: route.id, transform: undefined, output: undefined }}
                        className="grid gap-3 rounded-lg border border-border/60 px-4 py-4 transition-colors hover:bg-muted/10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="min-w-0 space-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-medium text-foreground">{route.id}</div>
                            {route.cache && (
                              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                                Cacheable
                              </Badge>
                            )}
                          </div>

                          {route.transforms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <div className="inline-flex items-center gap-1.5">
                                <Layers3 className="h-3.5 w-3.5" />
                                <span className="font-medium tabular-nums text-foreground">{route.transforms.length}</span>
                              </div>
                              {visibleTransforms.map((transform) => (
                                <span key={transform} className="rounded-full bg-muted/20 px-2.5 py-1 text-foreground">
                                  {transform}
                                </span>
                              ))}
                              {hiddenTransforms > 0 && (
                                <span className="rounded-full bg-muted/20 px-2.5 py-1 text-foreground">
                                  +
                                  {hiddenTransforms}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground sm:justify-end">
                          <div className="inline-flex items-center gap-1.5">
                            <FolderTree className="h-3.5 w-3.5" />
                            <span className="font-medium tabular-nums text-foreground">{route.dependsAmount}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5">
                            <Layers3 className="h-3.5 w-3.5" />
                            <span className="font-medium tabular-nums text-foreground">{route.transforms.length}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5">
                            <Boxes className="h-3.5 w-3.5" />
                            <span className="font-medium tabular-nums text-foreground">{route.outputsAmount}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            : (
                <div className="rounded-lg border border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  No routes
                </div>
              )}
        </section>
      </CardContent>
    </Card>
  );
}
