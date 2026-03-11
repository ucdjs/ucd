import type { SourceResponse } from "#shared/schemas/source";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import { FileCode2, FolderTree, GitBranchPlus, Layers3, Workflow } from "lucide-react";

export type SourceFileCardData = SourceResponse["files"][number];

interface SourceFileCardProps {
  sourceId: string;
  file: SourceFileCardData;
}

export function SourceFileCard({
  sourceId,
  file,
}: SourceFileCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden border-border transition-colors hover:border-primary/40">
      <Link
        to="/s/$sourceId/$sourceFileId"
        params={{ sourceId, sourceFileId: file.id }}
        className="block min-w-0 border-b border-border/70 bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/25"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="truncate text-sm font-medium">{file.label}</div>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{file.path}</div>
          </div>
          <Badge variant="outline" className="h-6 shrink-0 px-2 text-[11px]">
            {file.pipelines.length}
          </Badge>
        </div>
      </Link>

      <CardContent className="grid min-w-0 gap-1 p-1.5">
        {file.pipelines.length === 0
          ? (
              <div className="rounded-md px-2.5 py-3 text-xs text-muted-foreground">
                No pipelines found in this file.
              </div>
            )
          : (
              file.pipelines.map((pipeline) => (
                <Link
                  key={pipeline.id}
                  to="/s/$sourceId/$sourceFileId/$pipelineId"
                  params={{ sourceId, sourceFileId: file.id, pipelineId: pipeline.id }}
                  className="min-w-0 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-muted/15"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {pipeline.name || pipeline.id}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {pipeline.description || pipeline.id}
                      </div>
                    </div>
                    <Workflow className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="mt-1.5 flex min-w-0 flex-wrap gap-2.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <Layers3 className="h-3 w-3" />
                      {pipeline.versions.length}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <GitBranchPlus className="h-3 w-3" />
                      {pipeline.routeCount}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <FolderTree className="h-3 w-3" />
                      {pipeline.sourceCount}
                    </span>
                  </div>
                </Link>
              ))
            )}
      </CardContent>
    </Card>
  );
}
