import type { PipelineInfo } from "@ucdjs/pipelines-ui/schemas";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { ChevronRight, GitBranch, Route as RouteIcon, Tag } from "lucide-react";

export function PipelineCard({ pipeline, sourceId, fileId }: {
  pipeline: PipelineInfo;
  sourceId: string;
  fileId: string;
}) {
  return (
    <Link
      to="/$sourceId/$fileId/$pipelineId"
      params={{ sourceId, fileId, pipelineId: pipeline.id }}
      className="group rounded-md border border-border bg-muted/30 p-4 text-sm transition hover:border-primary/40 hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-foreground group-hover:text-primary truncate">
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {pipeline.name || pipeline.id}
          </div>
          {pipeline.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {pipeline.description}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5 transition" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <RouteIcon className="w-3 h-3" />
          {pipeline.routeCount}
          {" "}
          route
          {pipeline.routeCount !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Tag className="w-3 h-3" />
          {pipeline.versions.length}
          {" "}
          version
          {pipeline.versions.length !== 1 ? "s" : ""}
        </span>
        {pipeline.tags && pipeline.tags.length > 0 && (
          <>
            {pipeline.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {tag}
              </Badge>
            ))}
            {pipeline.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +
                {pipeline.tags.length - 3}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
