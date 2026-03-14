import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { useEffect, useMemo } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const navigate = Route.useNavigate();
  const search = InspectRoute.useSearch();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;

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

  useEffect(() => {
    if (!selectedTransform || search.transform === selectedTransform.name) {
      return;
    }

    navigate({
      replace: true,
      search: (current) => ({
        q: current.q,
        route: current.route,
        transform: selectedTransform.name,
        output: current.output,
      }),
    });
  }, [navigate, search.transform, selectedTransform]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedTransform?.name ?? "No transform selected"}</CardTitle>
        <CardDescription>
          Review which routes use the selected transform and jump back into the route inspector from there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedTransform
          ? (
              <>
                <section className="space-y-3">
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline transforms</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a transform name to see which routes in the pipeline use it.
                    </p>
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
                                q: current.q,
                                route: current.route,
                                transform: transform.name,
                                output: current.output,
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedTransform.routes.length}
                      {" "}
                      routes use this transform
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Routes</h3>
                    <p className="text-sm text-muted-foreground">
                      Open the route-focused inspect page for any route using this transform.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedTransform.routes.map((routeId) => (
                      <Link
                        key={routeId}
                        to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
                        params={params}
                        search={(current) => ({
                          q: current.q,
                          route: routeId,
                          transform: selectedTransform.name,
                          output: undefined,
                        })}
                        className="rounded-lg border border-border/60 bg-muted/10 p-4 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{routeId}</div>
                            <div className="text-xs text-muted-foreground">Open route inspect view</div>
                          </div>
                          <Badge variant="outline">route</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )
          : (
              <div className="text-sm text-muted-foreground">No transforms are defined for this pipeline.</div>
            )}
      </CardContent>
    </Card>
  );
}
