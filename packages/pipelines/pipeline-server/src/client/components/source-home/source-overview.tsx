import { useSuspenseQuery } from "@tanstack/react-query";
import { overviewQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { AlertCircle, FileCode, GitBranch, Play } from "lucide-react";

export function SourceOverview({ sourceId }: { sourceId: string }) {
  const { data: overview } = useSuspenseQuery(
    overviewQueryOptions({ baseUrl: "" }),
  );

  const sourceStats = overview.stats.sources.find((s) => s.id === sourceId);
  const fileCount = sourceStats?.fileCount ?? 0;
  const pipelineCount = sourceStats?.pipelineCount ?? 0;
  const errorCount = sourceStats?.errorCount ?? 0;

  return (
    <>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <FileCode className="w-3 h-3" />
        {fileCount}
        {" "}
        file
        {fileCount !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <GitBranch className="w-3 h-3" />
        {pipelineCount}
        {" "}
        pipeline
        {pipelineCount !== 1 ? "s" : ""}
      </span>
      <span className={`inline-flex items-center gap-1 text-xs ${errorCount > 0 ? "text-red-600" : "text-muted-foreground"}`}>
        <AlertCircle className="w-3 h-3" />
        {errorCount}
        {" "}
        error
        {errorCount !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Play className="w-3 h-3" />
        {overview.stats.totalExecutions}
        {" "}
        execution
        {overview.stats.totalExecutions !== 1 ? "s" : ""}
      </span>
    </>
  );
}

SourceOverview.Skeleton = function SourceOverviewSkeleton() {
  return (
    <>
      {["files", "pipelines", "errors", "executions"].map((label) => (
        <span key={label} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded bg-muted animate-pulse" />
          <span className="w-12 h-4 rounded bg-muted animate-pulse" />
        </span>
      ))}
    </>
  );
};
