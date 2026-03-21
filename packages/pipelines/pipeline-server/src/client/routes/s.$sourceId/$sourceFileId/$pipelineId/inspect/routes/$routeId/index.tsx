import { DefinitionGraph } from "#components/inspect/definition-graph";
import { RouteDependenciesSection } from "#components/inspect/route-dependencies-section";
import { RouteOutputsSection } from "#components/inspect/route-outputs-section";
import { RouteTransformsSection } from "#components/inspect/route-transforms-section";
import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowLeft, FolderOutput, Link2, Shuffle, Spline } from "lucide-react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId/")({
  component: RouteDetailPage,
});

function RouteDetailPage() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { sourceId, sourceFileId, pipelineId, routeId } = Route.useParams();
  const navigate = useNavigate();

  const selectedRoute = pipeline.routes.find((route) => route.id === routeId);

  if (!selectedRoute) {
    return (
      <div className="rounded-lg border border-border/60 px-4 py-10 text-sm text-muted-foreground">
        Route &ldquo;{routeId}&rdquo; not found in this pipeline.
      </div>
    );
  }

  function handleRouteSelect(id: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId",
      params: { sourceId, sourceFileId, pipelineId, routeId: id },
    });
  }

  return (
    <div className="space-y-4">
      <Link
        to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes"
        params={{ sourceId, sourceFileId, pipelineId }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to routes
      </Link>

      <Card>
        <CardContent className="space-y-5 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/10">
                  <Spline className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">{selectedRoute.id}</h2>
                    {selectedRoute.cache
                      ? <Badge variant="secondary">Cacheable</Badge>
                      : null}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="grid min-w-[15rem] grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-sm font-semibold tabular-nums text-foreground">{selectedRoute.depends.length}</div>
                  <div className="text-[11px] text-muted-foreground">depends</div>
                </div>
                <div className="space-y-1">
                  <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-sm font-semibold tabular-nums text-foreground">{selectedRoute.transforms.length}</div>
                  <div className="text-[11px] text-muted-foreground">transforms</div>
                </div>
                <div className="space-y-1">
                  <FolderOutput className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-sm font-semibold tabular-nums text-foreground">{selectedRoute.outputs.length}</div>
                  <div className="text-[11px] text-muted-foreground">outputs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Route filter</div>
              <code className="block break-all rounded-lg border border-border/60 px-3 py-3 text-xs">
                {selectedRoute.filter ?? "Custom filter"}
              </code>
            </div>
            {pipeline.include && (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Pipeline scope</div>
                <code className="block break-all rounded-lg border border-border/60 px-3 py-3 text-xs">
                  {pipeline.include}
                </code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Spline className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Route neighbors</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-48 p-0">
          <DefinitionGraph
            pipeline={pipeline}
            selectedRouteId={selectedRoute.id}
            onRouteSelect={handleRouteSelect}
            mode="neighbors"
            className="h-48"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <RouteDependenciesSection route={selectedRoute} />
        <RouteTransformsSection route={selectedRoute} />
        <RouteOutputsSection route={selectedRoute} />
      </div>
    </div>
  );
}
