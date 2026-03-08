import { cn } from "#lib/utils";
import { Link, useParams } from "@tanstack/react-router";

function usePipelineRouteParams() {
  const params = useParams({ strict: false });
  const sourceId = "sourceId" in params && typeof params.sourceId === "string" ? params.sourceId : null;
  const sourceFileId = "sourceFileId" in params && typeof params.sourceFileId === "string" ? params.sourceFileId : null;
  const pipelineId = "pipelineId" in params && typeof params.pipelineId === "string" ? params.pipelineId : null;

  if (!sourceId || !sourceFileId || !pipelineId) {
    throw new Error("PipelineTabs must be used within a pipeline route.");
  }

  return {
    sourceId,
    sourceFileId,
    pipelineId,
  };
}

export function PipelineTabs() {
  const { sourceId, sourceFileId, pipelineId } = usePipelineRouteParams();

  return (
    <nav
      className="px-6 pt-4 flex flex-wrap gap-1 border-b border-border"
      role="tablist"
      aria-label="Pipeline sections"
    >
      <Link
        to="/s/$sourceId/$sourceFileId/$pipelineId"
        params={{ sourceId, sourceFileId, pipelineId }}
        activeOptions={{ exact: true }}
        className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
        activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
        inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
      >
        Overview
      </Link>
      <Link
        to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
        params={{ sourceId, sourceFileId, pipelineId }}
        className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
        activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
        inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
      >
        Inspect
      </Link>
      <Link
        to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
        params={{ sourceId, sourceFileId, pipelineId }}
        className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
        activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
        inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
      >
        Executions
      </Link>
      <Link
        to="/s/$sourceId/$sourceFileId/$pipelineId/graphs"
        params={{ sourceId, sourceFileId, pipelineId }}
        className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px"
        activeProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-primary text-primary bg-primary/5") }}
        inactiveProps={{ className: cn("px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px", "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50") }}
      >
        Graphs
      </Link>
    </nav>
  );
}
