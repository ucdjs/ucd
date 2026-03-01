import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { createLazyFileRoute, Outlet, useLoaderData, useParams } from "@tanstack/react-router";
import { usePipelineVersions, VersionSelector } from "@ucdjs/pipelines-ui";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId")({
  component: PipelineDetailLayout,
});

function PipelineDetailLayout() {
  const { pipelineId } = useParams({ from: "/$sourceId/$fileId/$pipelineId" });
  const data = useLoaderData({ from: "/$sourceId/$fileId/$pipelineId" });
  const pipeline = data.pipeline;
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(
    pipelineId,
    pipeline?.versions || [],
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <PipelineHeader />
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <VersionSelector
            versions={pipeline?.versions || []}
            selectedVersions={selectedVersions}
            onToggleVersion={toggleVersion}
            onSelectAll={() => selectAll(pipeline?.versions || [])}
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
