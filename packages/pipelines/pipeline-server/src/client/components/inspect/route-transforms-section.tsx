import { getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { useMemo } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");
const InspectIndexRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect/");

export function RouteTransformsSection() {
  const navigate = InspectIndexRoute.useNavigate();
  const search = InspectRoute.useSearch();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const selectedRoute = pipeline.routes.find((route) => route.id === search.route) ?? pipeline.routes[0] ?? null;
  const selectedTransform = selectedRoute?.transforms.includes(search.transform ?? "") ? search.transform ?? null : null;

  const transformRoutes = useMemo(() => {
    if (!selectedTransform) {
      return [];
    }

    return pipeline.routes.filter((route) => route.transforms.includes(selectedTransform));
  }, [pipeline.routes, selectedTransform]);

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

  function toggleTransform(transform: string) {
    navigate({
      search: (current) => ({
        q: current.q,
        route: current.route,
        transform: current.transform === transform ? undefined : transform,
        output: current.output,
      }),
    });
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Transforms</h3>
        <p className="text-sm text-muted-foreground">
          Select a transform to see which other routes in the pipeline also use it.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedRoute?.transforms.length
          ? selectedRoute.transforms.map((transform, index) => {
              const active = selectedTransform === transform;
              return (
                <button
                  key={`${transform}-${index}`}
                  type="button"
                  onClick={() => toggleTransform(transform)}
                  className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${active ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-foreground hover:bg-muted"}`}
                >
                  {transform}
                </button>
              );
            })
          : <span className="text-sm text-muted-foreground">No transforms.</span>}
      </div>
      {selectedTransform && selectedRoute && (
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{selectedTransform}</div>
              <div className="text-sm text-muted-foreground">
                Routes in this pipeline that use the selected transform.
              </div>
            </div>
            <Badge variant="outline">
              {transformRoutes.length}
              {" "}
              routes
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {transformRoutes.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => selectRoute(route.id)}
                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${route.id === selectedRoute.id ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-foreground hover:bg-muted"}`}
              >
                {route.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
