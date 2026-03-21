import { DefinitionGraph } from "#components/inspect/definition-graph";
import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/")({
  component: RoutesIndexPage,
});

function RoutesIndexPage() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const navigate = useNavigate();

  function handleRouteSelect(routeId: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId",
      params: { sourceId, sourceFileId, pipelineId, routeId },
    });
  }

  return (
    <Card className="min-h-[28rem] overflow-hidden">
      <CardContent className="h-full min-h-[28rem] p-0">
        <DefinitionGraph
          pipeline={pipeline}
          selectedRouteId={undefined}
          onRouteSelect={handleRouteSelect}
          mode="full"
          className="min-h-[28rem]"
        />
      </CardContent>
    </Card>
  );
}
