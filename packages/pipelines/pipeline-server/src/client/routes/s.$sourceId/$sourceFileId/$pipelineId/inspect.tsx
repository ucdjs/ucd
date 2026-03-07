import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { data } = useSuspenseQuery(pipelineQueryOptions({ sourceId, fileId: sourceFileId, pipelineId }));
  const pipeline = data.pipeline;
  const [search, setSearch] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState(pipeline.routes[0]?.id ?? null);

  const routes = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) {
      return pipeline.routes;
    }

    return pipeline.routes.filter((route) => route.id.toLowerCase().includes(value));
  }, [pipeline.routes, search]);

  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null;

  return (
    <div className="p-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search routes"
            aria-label="Search routes"
          />
          <div className="space-y-2">
            {routes.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${route.id === selectedRoute?.id ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{route.id}</span>
                  {route.cache
                    ? <Badge variant="secondary">cache</Badge>
                    : <Badge variant="outline">live</Badge>}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedRoute?.id ?? "No route selected"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRoute
            ? (
                <>
                  <section className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Depends</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoute.depends.length === 0
                        ? <span className="text-sm text-muted-foreground">No dependencies.</span>
                        : selectedRoute.depends.map((dependency, index) => (
                            <Badge key={`${dependency.type}-${index}`} variant="outline">
                              {dependency.type === "route"
                                ? `route:${dependency.routeId}`
                                : `artifact:${dependency.routeId}:${dependency.artifactName}`}
                            </Badge>
                          ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Emits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoute.emits.length === 0
                        ? <span className="text-sm text-muted-foreground">No emitted artifacts.</span>
                        : selectedRoute.emits.map((emit) => (
                            <Badge key={emit.id} variant="secondary">
                              {emit.id}
                              {" "}
                              <span className="text-[10px] opacity-70">{emit.scope}</span>
                            </Badge>
                          ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Transforms</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoute.transforms.length === 0
                        ? <span className="text-sm text-muted-foreground">No transforms.</span>
                        : selectedRoute.transforms.map((transform, index) => (
                            <Badge key={`${transform}-${index}`} variant="outline">{transform}</Badge>
                          ))}
                    </div>
                  </section>
                </>
              )
            : (
                <div className="text-sm text-muted-foreground">No route matches the current filter.</div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
