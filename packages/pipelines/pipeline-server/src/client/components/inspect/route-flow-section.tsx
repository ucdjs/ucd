import { useInspectData } from "#hooks/use-inspect-data";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowDownRight, ArrowUpRight, Spline } from "lucide-react";
import { useMemo } from "react";

export function RouteFlowSection() {
  const { pipeline, selectedRoute, navigateToRoute } = useInspectData();

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

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Spline className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Route flow</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            Upstream routes
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {upstreamRoutes.length === 0
              ? <span className="text-sm text-muted-foreground">No route dependencies.</span>
              : upstreamRoutes.map((routeId) => (
                  <Button
                    key={routeId}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToRoute(routeId)}
                  >
                    {routeId}
                  </Button>
                ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
            Downstream routes
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {downstreamRoutes.length === 0
              ? <span className="text-sm text-muted-foreground">No downstream routes reference this route.</span>
              : downstreamRoutes.map((routeId) => (
                  <Button
                    key={routeId}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToRoute(routeId)}
                  >
                    {routeId}
                  </Button>
                ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
