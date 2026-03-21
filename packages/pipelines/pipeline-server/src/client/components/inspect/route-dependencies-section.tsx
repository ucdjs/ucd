import { useInspectData } from "#hooks/use-inspect-data";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Link2, Spline } from "lucide-react";

export function RouteDependenciesSection() {
  const { selectedRoute, navigateToRoute } = useInspectData();

  if (!selectedRoute) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Dependencies</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedRoute.depends.length
          ? selectedRoute.depends.map((dependency) => (
              <Button
                key={`${dependency.type}-${dependency.routeId}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigateToRoute(dependency.routeId)}
              >
                <Spline className="h-3 w-3" />
                route:
                {" "}
                {dependency.routeId}
              </Button>
            ))
          : <span className="text-sm text-muted-foreground">No dependencies.</span>}
      </div>
    </section>
  );
}
