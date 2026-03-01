import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { usePipelineVersions, VersionSelector } from "@ucdjs/pipelines-ui";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId")({
  notFoundComponent: NotFoundComponent,
  component: PipelineDetailLayout,
});

function PipelineDetailLayout() {
  const { pipelineId } = Route.useParams();
  const { pipelineData } = Route.useLoaderData();
  const pipeline = pipelineData?.pipeline;
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

function NotFoundComponent() {
  const { sourceId, fileId, pipelineId } = Route.useParams();

  return (
    <div className="flex-1 flex items-center justify-center" role="alert">
      <div className="text-center max-w-md mx-auto p-6">
        <p className="text-sm text-destructive mb-2">Pipeline not found</p>
        <p className="text-xs text-muted-foreground">
          Pipeline: {sourceId}/{fileId}/{pipelineId}
        </p>
      </div>
    </div>
  );
}