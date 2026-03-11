import { ExecutionTable } from "#components/execution/execution-table";
import { executionsQueryOptions } from "#queries/execution";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/")({
  loader: async ({ context, params }) => {
    return {
      executions: await context.queryClient.ensureQueryData(executionsQueryOptions({
        sourceId: params.sourceId,
        fileId: params.sourceFileId,
        pipelineId: params.pipelineId,
        limit: 50,
      })),
    };
  },
  component: ExecutionsListPage,
});

function ExecutionsListPage() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { executions: data } = Route.useLoaderData();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Executions</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.executions.length}
                {" "}
                total runs
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ExecutionTable
            executions={data.executions.map((execution) => ({
              ...execution,
              sourceId,
              fileId: sourceFileId,
              pipelineId,
            }))}
            emptyTitle="No executions yet"
            emptyDescription="Execute the pipeline to see results here"
            showGraphLink
          />
        </CardContent>
      </Card>
    </div>
  );
}
