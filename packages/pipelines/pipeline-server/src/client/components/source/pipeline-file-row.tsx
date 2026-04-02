import type { SourceFileInfo } from "#shared/schemas/source";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/components";
import { ChevronDown, ChevronRight, FileCode2, FolderTree, Layers3, Workflow as PipelineIcon, Spline } from "lucide-react";
import { useState } from "react";

interface PipelineFileRowProps {
  file: SourceFileInfo;
  sourceId: string;
  defaultExpanded?: boolean;
}

export function PipelineFileRow({ file, sourceId, defaultExpanded = false }: PipelineFileRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/40">
          <FileCode2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{file.label}</div>
          <div className="text-xs text-muted-foreground truncate">{file.path}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="secondary" className="text-[10px]">
            {file.pipelines.length}
            {" "}
            {file.pipelines.length === 1 ? "pipeline" : "pipelines"}
          </Badge>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && file.pipelines.map((pipeline) => (
        <Link
          key={pipeline.id}
          to="/s/$sourceId/$sourceFileId/$pipelineId"
          params={{ sourceId, sourceFileId: file.id, pipelineId: pipeline.id }}
          className="flex items-center gap-4 border-t border-border/30 px-5 pl-14 py-3 transition-colors hover:bg-muted/30"
        >
          <PipelineIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm min-w-0 flex-1 truncate">{pipeline.name || pipeline.id}</span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-3 w-3" />
              {pipeline.versions.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <Spline className="h-3 w-3" />
              {pipeline.routeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <FolderTree className="h-3 w-3" />
              {pipeline.sourceCount}
            </span>
          </div>
        </Link>
      ))}

      {expanded && file.pipelines.length === 0 && (
        <div className="border-t border-border/30 px-5 pl-14 py-3 text-xs text-muted-foreground">
          No pipelines in this file
        </div>
      )}
    </div>
  );
}
