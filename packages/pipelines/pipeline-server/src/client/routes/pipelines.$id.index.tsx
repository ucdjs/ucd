import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ExecutionResult, RouteList, SourceList } from "@ucdjs/pipelines-ui";
import { usePipelineDetailContext } from "../hooks/pipeline-detail-context";

export const Route = createFileRoute("/pipelines/$id/")({
  component: PipelineOverviewPage,
});

function ExecutionStatusCard() {
  const { execution } = usePipelineDetailContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {execution.result
          ? (
              <ExecutionResult result={execution.result} />
            )
          : (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <span>No runs yet. Execute the pipeline to see results.</span>
                <Badge variant="outline">Awaiting run</Badge>
              </div>
            )}
      </CardContent>
    </Card>
  );
}

function RoutesCard() {
  const { pipeline } = usePipelineDetailContext();

  if (!pipeline) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routes</CardTitle>
      </CardHeader>
      <CardContent>
        <RouteList
          routes={pipeline.routes.map((route) => ({
            id: route.id,
            cache: route.cache,
          }))}
        />
      </CardContent>
    </Card>
  );
}

function SourcesCard() {
  const { pipeline } = usePipelineDetailContext();

  if (!pipeline) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <SourceList sources={pipeline.sources} />
      </CardContent>
    </Card>
  );
}

function PipelineOverviewPage() {
  const { pipeline } = usePipelineDetailContext();

  if (!pipeline) {
    return null;
  }

  return (
    <div className="space-y-6" role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
      <ExecutionStatusCard />

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,1fr)_minmax(250px,0.8fr)]">
        <RoutesCard />
        <SourcesCard />
      </div>
    </div>
  );
}
