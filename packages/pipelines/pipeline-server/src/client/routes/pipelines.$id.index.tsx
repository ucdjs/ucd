import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ExecutionResult, RouteList, SourceList } from "@ucdjs/pipelines-ui";
import { Suspense } from "react";
import { usePipelineDetailContext } from "../hooks/pipeline-detail-context";

function ExecutionStatusCard() {
  const { execution } = usePipelineDetailContext();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Execution Status</CardTitle>
        <CardDescription>
          Pipeline execution results and summary
        </CardDescription>
      </CardHeader>
      <CardContent>
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

interface RoutesCardProps {
  pipelineId: string;
}

function RoutesCard({ pipelineId }: RoutesCardProps) {
  const { pipeline } = usePipelineDetailContext();

  if (!pipeline) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Routes</CardTitle>
        <CardDescription>
          Click a route to view its code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RouteList
          routes={pipeline.routes.map((route) => ({
            id: route.id,
            cache: route.cache,
          }))}
          onRouteClick={(routeId) => {
            // Navigate to code tab
            window.location.href = `/pipelines/${pipelineId}/code?route=${routeId}`;
          }}
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Sources</CardTitle>
        <CardDescription>
          Input sources for this pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SourceList sources={pipeline.sources} />
      </CardContent>
    </Card>
  );
}

function PipelineOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-48 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,1fr)_minmax(250px,0.8fr)]">
        <Card>
          <CardHeader className="pb-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/pipelines/$id/")({
  component: PipelineOverviewPage,
});

function PipelineOverviewPage() {
  const { pipeline } = usePipelineDetailContext();
  const { id } = Route.useParams();

  if (!pipeline) {
    return null;
  }

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
      <Suspense fallback={<PipelineOverviewSkeleton />}>
        <div className="space-y-6">
          <ExecutionStatusCard />

          <div className="grid gap-6 lg:grid-cols-[minmax(300px,1fr)_minmax(250px,0.8fr)]">
            <RoutesCard pipelineId={id} />
            <SourcesCard />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
