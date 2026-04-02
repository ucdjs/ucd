import { ExecutionTable } from "#components/execution/execution-table";
import { LatestExecution } from "#components/pipeline/latest-execution";
import { PipelineStructure } from "#components/pipeline/pipeline-structure";
import { PipelineSummary } from "#components/pipeline/pipeline-summary";
import { executionsQueryOptions } from "#queries/execution";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";
import { ArrowRight } from "lucide-react";

const ParentRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(executionsQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
      limit: 6,
    }));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { file, source, pipeline } = ParentRoute.useLoaderData();
  const { data: executionsData } = useSuspenseQuery(executionsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    limit: 6,
  }));
  const recentExecutions = executionsData.executions;
  const latestExecution = recentExecutions[0] ?? null;
  const latestGraphExecution = recentExecutions.find((execution) => execution.hasGraph) ?? null;
  const cacheableRouteCount = pipeline.routes.filter((route) => route.cache).length;
  const dependencyCount = pipeline.routes.reduce((count, route) => count + route.depends.length, 0);
  const transformCount = pipeline.routes.reduce((count, route) => count + route.transforms.length, 0);
  const outputCount = pipeline.routes.reduce((count, route) => count + route.outputs.length, 0);
  const inspectRoutes = pipeline.routes.toSorted((left, right) => {
    const leftScore = left.depends.length + left.transforms.length + left.outputs.length;
    const rightScore = right.depends.length + right.transforms.length + right.outputs.length;

    return rightScore - leftScore;
  })
    .slice(0, 6)
    .map((route) => ({
      id: route.id,
      cache: route.cache,
      dependsAmount: route.depends.length,
      transforms: route.transforms,
      outputsAmount: route.outputs.length,
    }));

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-12 2xl:grid-cols-16">
        <LatestExecution
          latestExecution={latestExecution}
          latestGraphExecution={latestGraphExecution}
        />

        <PipelineSummary
          sourceId={sourceId}
          sourceLabel={source.label}
          sourceCount={pipeline.sourceCount}
          fileLabel={file.label}
          filePath={file.path}
          include={pipeline.include}
          versions={pipeline.versions}
        />

        <PipelineStructure
          routes={pipeline.routeCount}
          dependencies={dependencyCount}
          transforms={transformCount}
          outputs={outputCount}
          versions={pipeline.versions.length}
          cacheableRoutes={cacheableRouteCount}
          inspectRoutes={inspectRoutes}
        />

        <Card className="xl:col-span-12 2xl:col-span-16">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Recent executions</CardTitle>
              <Button
                nativeButton={false}
                variant="outline"
                size="sm"
                render={(props) => (
                  <Link
                    to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
                    params={{ sourceId, sourceFileId, pipelineId }}
                    {...props}
                  >
                    All executions
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ExecutionTable
              executions={recentExecutions}
              emptyTitle="No executions yet"
              showGraphLink
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
