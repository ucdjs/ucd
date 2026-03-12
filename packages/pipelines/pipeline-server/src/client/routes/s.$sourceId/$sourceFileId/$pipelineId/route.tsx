import { PipelineHeader } from "#components/pipeline/pipeline-header";
import { PipelineTabs } from "#components/pipeline/pipeline-tabs";
import { VersionSelector } from "#components/pipeline/version-selector";
import { usePipelineVersions } from "#hooks/use-pipeline-versions";
import { pipelineQueryOptions } from "#queries/pipeline";
import { sourceQueryOptions } from "#queries/source";
import { isNotFoundError } from "#queries/utils";
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
      ]);

      const file = source.files.find((file) => file.id === params.sourceFileId) ?? null;
      if (!file) {
        throw notFound();
      }

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
  const { file, pipelineResponse } = Route.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(
    pipelineId,
    pipeline.versions,
    `${sourceId}:${sourceFileId}:${pipelineId}`,
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <PipelineHeader selectedVersions={selectedVersions} pipeline={pipeline} fileLabel={file.label} />
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
