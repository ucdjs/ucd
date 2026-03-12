import { getRouteApi } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { GitBranchPlus, Layers3 } from "lucide-react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export function RouteSummary() {
  const search = InspectRoute.useSearch();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const selectedRoute = pipelineResponse.pipeline.routes.find((route) => route.id === search.route)
    ?? pipelineResponse.pipeline.routes[0]
    ?? null;

  return (
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{selectedRoute?.id ?? "No route selected"}</CardTitle>
          <CardDescription>
            Inspect how this route depends on other routes, which transforms it uses, and how outputs are defined.
          </CardDescription>
        </div>
        {selectedRoute && (
          <div className="flex flex-wrap items-center gap-3">
            {selectedRoute.cache
              ? <Badge variant="secondary">cache enabled</Badge>
              : <Badge variant="outline">live execution</Badge>}
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <GitBranchPlus className="h-3 w-3" />
              {selectedRoute.transforms.length}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Layers3 className="h-3 w-3" />
              {selectedRoute.outputs.length}
            </span>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
