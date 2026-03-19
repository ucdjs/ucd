import { useInspectData } from "#hooks/use-inspect-data";
import { getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, RouteIcon, Shuffle } from "lucide-react";
import { useMemo } from "react";

const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export function InspectTransformsPanel() {
  const navigate = InspectRoute.useNavigate();
  const { pipeline, search } = useInspectData();

  const transforms = useMemo(() => {
    const transformMap = new Map<string, string[]>();

    for (const route of pipeline.routes) {
      for (const transform of route.transforms) {
        const routes = transformMap.get(transform);
        if (routes) {
          routes.push(route.id);
        } else {
          transformMap.set(transform, [route.id]);
        }
      }
    }

    return Array.from(transformMap.entries(), ([name, routes]) => ({ name, routes }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [pipeline.routes]);

  const selectedTransform = transforms.find((transform) => transform.name === search.transform) ?? transforms[0] ?? null;

  return (
    <Card>
      {selectedTransform
        ? (
            <>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                    <Shuffle className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="truncate text-lg">{selectedTransform.name}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {selectedTransform.routes.length}
                        {" "}
                        {selectedTransform.routes.length === 1 ? "route" : "routes"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-0.5">
                      Routes using this transform across the pipeline.
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shuffle className="h-3.5 w-3.5" />
                      Total transforms
                    </div>
                    <div className="mt-1 text-xl font-semibold tabular-nums">{transforms.length}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RouteIcon className="h-3.5 w-3.5" />
                      Uses this transform
                    </div>
                    <div className="mt-1 text-xl font-semibold tabular-nums">{selectedTransform.routes.length}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline transforms</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {transforms.map((transform) => {
                      const active = transform.name === selectedTransform.name;
                      return (
                        <button
                          key={transform.name}
                          type="button"
                          onClick={() => {
                            navigate({
                              search: (current) => ({
                                ...current,
                                transform: transform.name,
                              }),
                            });
                          }}
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${active ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-foreground hover:bg-muted"}`}
                        >
                          {transform.name}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Routes</h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedTransform.routes.map((routeId) => (
                      <button
                        key={routeId}
                        type="button"
                        onClick={() => {
                          navigate({
                            search: (current) => ({
                              ...current,
                              route: routeId,
                              view: undefined,
                              transform: selectedTransform.name,
                            }),
                          });
                        }}
                        className="rounded-lg border border-border/60 bg-muted/10 p-4 text-left transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{routeId}</div>
                            <div className="text-xs text-muted-foreground">Open route inspect view</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </CardContent>
            </>
          )
        : (
            <CardHeader className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                <Shuffle className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <CardTitle className="text-base">No transforms defined</CardTitle>
              <CardDescription>
                This pipeline has no transforms configured.
              </CardDescription>
            </CardHeader>
          )}
    </Card>
  );
}
