import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { usePipelineVersions, VersionSelector } from "@ucdjs/pipelines-ui";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui/functions";

export function PipelineVersionBar() {
  const { sourceId, fileId, pipelineId } = useParams({ from: "/$sourceId/$fileId/$pipelineId" });
  const { data } = useSuspenseQuery(
    pipelineQueryOptions({ sourceId, fileId, pipelineId }),
  );
  const pipeline = data?.pipeline;
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(
    pipelineId,
    pipeline?.versions || [],
    `${fileId}:${pipelineId}`,
  );

  return (
    <div className="px-6 py-3 border-b border-border bg-muted/30">
      <VersionSelector
        versions={pipeline?.versions || []}
        selectedVersions={selectedVersions}
        onToggleVersion={toggleVersion}
        onSelectAll={() => selectAll(pipeline?.versions || [])}
        onDeselectAll={deselectAll}
      />
    </div>
  );
}

PipelineVersionBar.Skeleton = function PipelineVersionBarSkeleton() {
  return (
    <div className="px-6 py-3 border-b border-border bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <span className="w-24 h-3 rounded bg-muted animate-pulse" />
        <div className="flex gap-2">
          <span className="w-6 h-3 rounded bg-muted animate-pulse" />
          <span className="w-8 h-3 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="w-14 h-7 rounded bg-muted animate-pulse" />
        <span className="w-16 h-7 rounded bg-muted animate-pulse" />
        <span className="w-12 h-7 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
};
