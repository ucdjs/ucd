import { Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, Boxes, FolderTree, Layers3, Route as RouteIcon } from "lucide-react";
import { RouteStructureMetrics } from "./route-structure-metrics";

export interface PipelineStructureRouteItem {
  id: string;
  cache: boolean;
  dependsAmount: number;
  transformsAmount: number;
  outputsAmount: number;
}

export interface PipelineStructureProps {
  routes: number;
  dependencies: number;
  transforms: number;
  outputs: number;
  versions: number;
  cacheableRoutes: number;
  topRoutes: PipelineStructureRouteItem[];
}

export function PipelineStructure({
  routes,
  dependencies,
  transforms,
  outputs,
  versions,
  cacheableRoutes,
  topRoutes,
}: PipelineStructureProps) {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  return (
    <Card className="xl:col-span-12">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle>Pipeline structure</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border/60 p-4">
          <div className="space-y-4">
            <RouteStructureMetrics
              routes={routes}
              dependencies={dependencies}
              transforms={transforms}
              outputs={outputs}
            />

            <div className="border-t border-border/60 pt-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Versions</div>
                  <div className="text-3xl font-semibold leading-none text-foreground">{versions}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Cacheable routes</div>
                  <div className="text-3xl font-semibold leading-none text-foreground">{cacheableRoutes}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border/60">
          {topRoutes.length > 0
            ? (
                <div className="divide-y divide-border/60">
                  {topRoutes.map((route) => (
                    <Link
                      key={route.id}
                      to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
                      params={{ sourceId, sourceFileId, pipelineId }}
                      search={{ q: undefined, route: route.id, transform: undefined, output: undefined }}
                      className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/10 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-medium text-foreground">{route.id}</div>
                          {route.cache && (
                            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                              Cacheable
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FolderTree className="h-3.5 w-3.5" />
                            <span className="font-medium tabular-nums text-foreground">{route.dependsAmount}</span>
                            <span>depends</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Layers3 className="h-3.5 w-3.5" />
                            <span className="font-medium tabular-nums text-foreground">{route.transformsAmount}</span>
                            <span>transforms</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Boxes className="h-3.5 w-3.5" />
                            <span className="font-medium tabular-nums text-foreground">{route.outputsAmount}</span>
                            <span>outputs</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RouteIcon className="h-3.5 w-3.5" />
                            <span>inspect</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground sm:mt-0.5" />
                    </Link>
                  ))}
                </div>
              )
            : (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  No routes
                </div>
              )}
        </section>
      </CardContent>
    </Card>
  );
}
