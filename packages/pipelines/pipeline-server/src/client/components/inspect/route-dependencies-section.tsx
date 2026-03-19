import { useInspectData } from "#hooks/use-inspect-data";
import { getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Link2, Package } from "lucide-react";
import { useMemo } from "react";

const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export function RouteDependenciesSection() {
  const { selectedRoute } = useInspectData();
  const navigate = InspectRoute.useNavigate();

  const artifactDependencies = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.depends.filter((dependency) => dependency.type === "artifact");
  }, [selectedRoute]);

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
    <>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Dependencies</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRoute.depends.length
            ? selectedRoute.depends.map((dependency) => (
                dependency.type === "route"
                  ? (
                      <button
                        key={`${dependency.type}-${dependency.routeId}`}
                        type="button"
                        onClick={() => selectRoute(dependency.routeId)}
                        className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        route:
                        {" "}
                        {dependency.routeId}
                      </button>
                    )
                  : (
                      <Badge key={`${dependency.type}-${dependency.routeId}-${dependency.artifactName}`} variant="outline">
                        artifact:
                        {" "}
                        {dependency.routeId}
                        :
                        {dependency.artifactName}
                      </Badge>
                    )
              ))
            : <span className="text-sm text-muted-foreground">No dependencies.</span>}
        </div>
        {artifactDependencies.length > 0 && (
          <div className="rounded-md border border-border/60 bg-muted/15 px-3 py-3 text-xs text-muted-foreground">
            {artifactDependencies.length}
            {" "}
            artifact dependenc
            {artifactDependencies.length === 1 ? "y" : "ies"}
            {" "}
            reference emitted artifacts rather than direct route-to-route edges.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Emits</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRoute.emits.length
            ? selectedRoute.emits.map((emit) => (
                <Badge key={emit.id} variant="secondary">
                  {emit.id}
                  {" "}
                  <span className="text-[10px] opacity-70">{emit.scope}</span>
                </Badge>
              ))
            : <span className="text-sm text-muted-foreground">No emitted artifacts.</span>}
        </div>
      </section>
    </>
  );
}
