import { ExecutionTable } from "#components/execution/execution-table";
import { executionsQueryOptions } from "#queries/execution";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";

const ParentRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(executionsQueryOptions({
      sourceId: params.sourceId,
      fileId: params.sourceFileId,
      pipelineId: params.pipelineId,
      limit: 50,
    }));
  },
  component: ExecutionsListPage,
});

function ExecutionsListPage() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { pipeline } = ParentRoute.useLoaderData();
  const { data } = useSuspenseQuery(executionsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    limit: 50,
  }));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="flex flex-col gap-1 border-b border-border/60 pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Executions</h1>
        <div className="text-sm text-muted-foreground">
          {pipeline.name || pipelineId}
          {" · "}
          {data.executions.length}
        </div>
      </header>

      <section className="rounded-2xl border border-border/60 bg-background p-4">
        <ExecutionTable
          executions={data.executions.map((execution) => ({
            ...execution,
            sourceId,
            fileId: sourceFileId,
            pipelineId,
          }))}
          emptyTitle="No executions yet"
          showGraphLink
        />
      </section>
    </div>
  );
}
