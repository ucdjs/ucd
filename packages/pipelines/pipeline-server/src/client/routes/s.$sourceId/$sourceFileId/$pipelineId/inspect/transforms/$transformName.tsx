import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowLeft, ArrowRight, Shuffle } from "lucide-react";
import { useMemo } from "react";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName")({
  component: TransformDetailPage,
});

function TransformDetailPage() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { sourceId, sourceFileId, pipelineId, transformName } = Route.useParams();

  const transformRoutes = useMemo(() => {
    return pipeline.routes.filter((route) => route.transforms.includes(transformName));
  }, [pipeline.routes, transformName]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/10">
                <Shuffle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{transformName}</h3>
                  <Badge variant="secondary">
                    {transformRoutes.length}
                    {" "}
                    {transformRoutes.length === 1 ? "route" : "routes"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {transformRoutes.map((route) => (
              <div key={route.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{route.id}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {route.depends.length}
                      {" "}
                      depends
                      {" \u00B7 "}
                      {route.outputs.length}
                      {" "}
                      outputs
                    </div>
                  </div>
                  <Link
                    to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId"
                    params={{ sourceId, sourceFileId, pipelineId, routeId: route.id }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Route
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
