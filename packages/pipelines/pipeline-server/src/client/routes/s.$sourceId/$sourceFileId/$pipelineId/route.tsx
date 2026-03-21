import { PipelineHeader } from "#components/pipeline/pipeline-header";
import { PipelineTabs } from "#components/pipeline/pipeline-tabs";
import { executionsQueryOptions } from "#queries/execution";
import { pipelineQueryOptions } from "#queries/pipeline";
import { sourceQueryOptions } from "#queries/source";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId")({
  loader: async ({ context, params }) => {
    try {
      const [source, pipelineResponse] = await Promise.all([
        context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId })),
        context.queryClient.ensureQueryData(pipelineQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
          pipelineId: params.pipelineId,
        })),
        context.queryClient.prefetchQuery(executionsQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
          pipelineId: params.pipelineId,
          limit: 1,
        })),
      ]);

      const file = source.files.find((file) => file.id === params.sourceFileId) ?? null;
      if (!file) {
        throw notFound();
      }

      return {
        file,
        source,
        pipelineResponse,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw notFound();
      }

      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { file, source, pipelineResponse } = Route.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { data: latestExecutionData } = useSuspenseQuery(executionsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    limit: 1,
  }));
  const latestExecution = latestExecutionData.executions[0] ?? null;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="shrink-0">
        <PipelineHeader
          pipeline={pipeline}
          sourceLabel={source.label}
          fileLabel={file.label}
          filePath={file.path}
          latestExecution={latestExecution}
        />
        <PipelineTabs />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
