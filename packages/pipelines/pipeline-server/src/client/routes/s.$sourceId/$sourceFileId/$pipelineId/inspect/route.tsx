import { createFileRoute, getRouteApi, Link, Outlet } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { useEffect, useMemo } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect")({
  validateSearch: (search): {
    q?: string;
    route?: string;
    transform?: string;
    output?: string;
  } => ({
    q: typeof search.q === "string" ? search.q : undefined,
    route: typeof search.route === "string" ? search.route : undefined,
    transform: typeof search.transform === "string" ? search.transform : undefined,
    output: typeof search.output === "string" ? search.output : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;

  const filteredRoutes = useMemo(() => {
    const value = search.q?.trim().toLowerCase() ?? "";
    if (!value) {
      return pipeline.routes;
    }

    return pipeline.routes.filter((route) => {
      return route.id.toLowerCase().includes(value)
        || route.transforms.some((transform) => transform.toLowerCase().includes(value))
        || route.emits.some((emit) => emit.id.toLowerCase().includes(value))
        || route.depends.some((dependency) => (
          dependency.type === "route"
            ? dependency.routeId.toLowerCase().includes(value)
            : `${dependency.routeId}:${dependency.artifactName}`.toLowerCase().includes(value)
        ));
    });
  }, [pipeline.routes, search.q]);

  const activeRouteId = useMemo(() => {
    if (search.route && filteredRoutes.some((route) => route.id === search.route)) {
      return search.route;
    }

    if (search.route && pipeline.routes.some((route) => route.id === search.route)) {
      return search.route;
    }

    return filteredRoutes[0]?.id ?? pipeline.routes[0]?.id ?? null;
  }, [filteredRoutes, pipeline.routes, search.route]);

  useEffect(() => {
    if (!activeRouteId || search.route === activeRouteId) {
      return;
    }

    navigate({
      replace: true,
      search: (current) => ({
        q: current.q,
        route: activeRouteId,
        transform: current.transform,
        output: current.output,
      }),
    });
  }, [activeRouteId, navigate, search.route]);

  return (
    <div className="p-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Inspect</CardTitle>
          <CardDescription>Move through route definitions, transforms, and outputs using the same inspect shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
              params={params}
              search={(current) => ({
                q: current.q,
                route: current.route,
                transform: undefined,
                output: undefined,
              })}
              activeProps={{ className: "border-primary/40 bg-primary/5" }}
              activeOptions={{ exact: true }}
              className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Routes
            </Link>
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms"
              params={params}
              search={(current) => ({
                q: current.q,
                route: current.route,
                transform: current.transform,
                output: undefined,
              })}
              activeProps={{ className: "border-primary/40 bg-primary/5" }}
              className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Transforms
            </Link>
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs"
              params={params}
              search={(current) => ({
                q: current.q,
                route: current.route,
                transform: undefined,
                output: current.output,
              })}
              activeProps={{ className: "border-primary/40 bg-primary/5" }}
              className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Outputs
            </Link>
          </div>

          <Input
            value={search.q ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              navigate({
                replace: true,
                search: (current) => ({
                  q: value || undefined,
                  route: current.route,
                  transform: current.transform,
                  output: current.output,
                }),
              });
            }}
            placeholder="Search routes, transforms, emits"
            aria-label="Search inspect routes"
          />

          <div className="space-y-2">
            {filteredRoutes.length === 0 && (
              <div className="rounded-md border border-dashed border-border/70 px-3 py-6 text-sm text-muted-foreground">
                No routes match the current filter.
              </div>
            )}
            {filteredRoutes.map((route) => (
              <Link
                key={route.id}
                to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
                params={params}
                search={(current) => ({
                  q: current.q,
                  route: route.id,
                  transform: undefined,
                  output: undefined,
                })}
                className={`block rounded-md border px-3 py-2 text-left text-sm ${route.id === activeRouteId ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{route.id}</span>
                  {route.cache
                    ? <Badge variant="secondary">cacheable</Badge>
                    : <Badge variant="outline">live</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {route.depends.length}
                    {" "}
                    deps
                  </span>
                  <span>
                    {route.transforms.length}
                    {" "}
                    transforms
                  </span>
                  <span>
                    {route.outputs.length}
                    {" "}
                    outputs
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Outlet />
    </div>
  );
}
