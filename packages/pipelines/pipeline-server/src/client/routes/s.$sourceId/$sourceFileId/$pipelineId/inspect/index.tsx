import { RouteDependenciesSection } from "#components/inspect/route-dependencies-section";
import { RouteFlowSection } from "#components/inspect/route-flow-section";
import { RouteOutputsSection } from "#components/inspect/route-outputs-section";
import { RouteSummary } from "#components/inspect/route-summary";
import { RouteTransformsSection } from "#components/inspect/route-transforms-section";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { useEffect } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = InspectRoute.useSearch();
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const selectedRoute = pipeline.routes.find((route) => route.id === search.route) ?? pipeline.routes[0] ?? null;
  const selectedTransform = selectedRoute?.transforms.includes(search.transform ?? "") ? search.transform ?? null : null;

  useEffect(() => {
    if (!selectedRoute || search.route === selectedRoute.id) {
      return;
    }

    navigate({
      replace: true,
      search: (current) => ({
        q: current.q,
        route: selectedRoute.id,
        transform: current.transform,
        output: current.output,
      }),
    });
  }, [navigate, search.route, selectedRoute]);

  useEffect(() => {
    if (!search.transform || selectedTransform) {
      return;
    }

    navigate({
      replace: true,
      search: (current) => ({
        q: current.q,
        route: current.route,
        transform: undefined,
        output: current.output,
      }),
    });
  }, [navigate, search.transform, selectedTransform]);

  return (
    <Card>
      <RouteSummary />
      <CardContent className="space-y-6">
        {selectedRoute
          ? (
              <>
                <RouteFlowSection />
                <RouteDependenciesSection />
                <RouteTransformsSection />
                <RouteOutputsSection />
              </>
            )
          : (
              <div className="text-sm text-muted-foreground">No route matches the current filter.</div>
            )}
      </CardContent>
    </Card>
  );
}
