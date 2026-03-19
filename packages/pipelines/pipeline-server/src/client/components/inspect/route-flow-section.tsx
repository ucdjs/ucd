import { useInspectData } from "#hooks/use-inspect-data";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Workflow } from "lucide-react";
import { useMemo } from "react";

const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export function RouteFlowSection() {
  const { pipeline, selectedRoute } = useInspectData();
  const navigate = InspectRoute.useNavigate();

  const routeMap = useMemo(() => {
    return new Map(pipeline.routes.map((route) => [route.id, route]));
  }, [pipeline.routes]);

  const upstreamRoutes = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.depends
      .filter((dependency) => dependency.type === "route")
      .map((dependency) => dependency.routeId)
      .filter((routeId) => routeMap.has(routeId));
  }, [routeMap, selectedRoute]);

  const downstreamRoutes = useMemo(() => {
    if (!selectedRoute) return [];
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

  if (!selectedRoute) return null;

  function selectRoute(routeId: string) {
    navigate({
      search: (current) => ({
        ...current,
        route: routeId,
        transform: undefined,
      }),
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Route flow</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border/60 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            Upstream routes
          </div>
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
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
            Downstream routes
          </div>
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
