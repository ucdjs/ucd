import { getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");
const InspectIndexRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect/");

export function RouteFlowSection() {
  const navigate = InspectIndexRoute.useNavigate();
  const search = InspectRoute.useSearch();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;

  const routeMap = useMemo(() => {
    return new Map(pipeline.routes.map((route) => [route.id, route]));
  }, [pipeline.routes]);

  const selectedRoute = routeMap.get(search.route ?? "") ?? pipeline.routes[0] ?? null;

  const upstreamRoutes = useMemo(() => {
    if (!selectedRoute) {
      return [];
    }

    return selectedRoute.depends
      .filter((dependency) => dependency.type === "route")
      .map((dependency) => dependency.routeId)
      .filter((routeId) => routeMap.has(routeId));
  }, [routeMap, selectedRoute]);

  const downstreamRoutes = useMemo(() => {
    if (!selectedRoute) {
      return [];
    }

    const emittedArtifactIds = new Set(selectedRoute.emits.map((emit) => emit.id));

    return pipeline.routes
      .filter((route) => route.id !== selectedRoute.id)
      .filter((route) => route.depends.some((dependency) => {
        if (dependency.type === "route") {
          return dependency.routeId === selectedRoute.id;
        }

        return dependency.routeId === selectedRoute.id || emittedArtifactIds.has(dependency.artifactName);
      }))
      .map((route) => route.id);
  }, [pipeline.routes, selectedRoute]);

  function selectRoute(routeId: string) {
    navigate({
      search: (current) => ({
        q: current.q,
        route: routeId,
        transform: undefined,
        output: current.output,
      }),
    });
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Route flow</h3>
        <p className="text-sm text-muted-foreground">
          Follow route dependencies upstream or jump to downstream routes that consume this route.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border/60 p-4">
          <div className="text-sm font-medium">Upstream routes</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {upstreamRoutes.length === 0
              ? <span className="text-sm text-muted-foreground">No route dependencies.</span>
              : upstreamRoutes.map((routeId) => (
                  <button
                    key={routeId}
                    type="button"
                    onClick={() => selectRoute(routeId)}
                    className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {routeId}
                  </button>
                ))}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 p-4">
          <div className="text-sm font-medium">Downstream routes</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {downstreamRoutes.length === 0
              ? <span className="text-sm text-muted-foreground">No downstream routes reference this route.</span>
              : downstreamRoutes.map((routeId) => (
                  <button
                    key={routeId}
                    type="button"
                    onClick={() => selectRoute(routeId)}
                    className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {routeId}
                  </button>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
