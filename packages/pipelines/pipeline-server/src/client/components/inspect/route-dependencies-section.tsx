import { getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");
const InspectIndexRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect/");

export function RouteDependenciesSection() {
  const navigate = InspectIndexRoute.useNavigate();
  const search = InspectRoute.useSearch();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const selectedRoute = pipelineResponse.pipeline.routes.find((route) => route.id === search.route)
    ?? pipelineResponse.pipeline.routes[0]
    ?? null;

  const artifactDependencies = selectedRoute?.depends.filter((dependency) => dependency.type === "artifact") ?? [];

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
    <>
      <section className="space-y-3">
        <div>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Dependencies</h3>
          <p className="text-sm text-muted-foreground">
            Route dependencies are clickable. Artifact dependencies stay visible as definition references.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRoute?.depends.length
            ? selectedRoute.depends.map((dependency, index) => (
                dependency.type === "route"
                  ? (
                      <button
                        key={`${dependency.type}-${dependency.routeId}-${index}`}
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
                      <Badge key={`${dependency.type}-${index}`} variant="outline">
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
        <div>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Emits</h3>
          <p className="text-sm text-muted-foreground">
            Artifacts emitted by this route and their scope.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRoute?.emits.length
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
