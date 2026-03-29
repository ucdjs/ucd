import { DefinitionGraph } from "#components/inspect/definition-graph";
import { usePipelineRouteData } from "#hooks/use-pipeline-route-data";
import { pipelineQueryOptions } from "#queries/pipeline";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/")({
  loader: async ({ context, params }) => {
    const pipeline = await context.queryClient.ensureQueryData(pipelineQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
    }));
    const firstRoute = pipeline.routes[0];
    if (firstRoute) {
      throw redirect({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId",
        params: { ...params, routeId: firstRoute.id },
      });
    }
  },
  component: RoutesIndexPage,
});

function RoutesIndexPage() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { pipeline } = usePipelineRouteData({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
  });
  const navigate = useNavigate();

  function handleRouteSelect(routeId: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId",
      params: { sourceId, sourceFileId, pipelineId, routeId },
    });
  }

  return (
    <Card className="min-h-112 overflow-hidden">
      <CardContent className="h-full min-h-112 p-0">
        <DefinitionGraph
          pipeline={pipeline!}
          selectedRouteId={undefined}
          onRouteSelect={handleRouteSelect}
          mode="full"
          className="min-h-112"
        />
      </CardContent>
    </Card>
  );
}
