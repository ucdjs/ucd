import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { VersionSelector } from "@ucdjs/pipelines-ui/components";
import {
  isNotFoundError,
  pipelineQueryOptions,
  sourceFileQueryOptions,
} from "@ucdjs/pipelines-ui/functions";
import { usePipelineVersions } from "@ucdjs/pipelines-ui/hooks";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId")({
  loader: async ({ context, params }) => {
    try {
      const [file, pipelineResponse] = await Promise.all([
        context.queryClient.ensureQueryData(sourceFileQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
        })),
        context.queryClient.ensureQueryData(pipelineQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
          pipelineId: params.pipelineId,
        })),
      ]);

      return {
        file,
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
  const { pipelineResponse } = Route.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(
    pipelineId,
    pipeline.versions,
    `${sourceId}:${sourceFileId}:${pipelineId}`,
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <PipelineHeader selectedVersions={selectedVersions} />
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <VersionSelector
            versions={pipeline.versions}
            selectedVersions={selectedVersions}
            onToggleVersion={toggleVersion}
            onSelectAll={() => selectAll(pipeline.versions)}
            onDeselectAll={deselectAll}
          />
        </div>
        <PipelineTabs />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
