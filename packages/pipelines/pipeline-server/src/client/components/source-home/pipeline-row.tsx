import type { PipelineInfo } from "@ucdjs/pipelines-ui/schemas";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { ChevronRight, GitBranch, Route as RouteIcon, Tag } from "lucide-react";

export function PipelineRow({ pipeline, sourceId, fileId }: {
  pipeline: PipelineInfo;
  sourceId: string;
  fileId: string;
}) {
  return (
    <Link
      to="/$sourceId/$fileId/$pipelineId"
      params={{ sourceId, fileId, pipelineId: pipeline.id }}
      className="group/pipeline block rounded px-2 py-2 transition hover:bg-muted/80"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground group-hover/pipeline:text-primary truncate">
            <GitBranch className="w-3 h-3 text-muted-foreground shrink-0" />
            {pipeline.name}
          </div>
          {pipeline.description && (
            <div className="text-[11px] text-muted-foreground line-clamp-1">
              {pipeline.description}
            </div>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover/pipeline:text-primary shrink-0 mt-0.5 transition" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <RouteIcon className="w-3 h-3" />
          {pipeline.routeCount}
          {" "}
          route
          {pipeline.routeCount !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
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
