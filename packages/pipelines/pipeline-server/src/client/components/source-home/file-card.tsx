import type { SourceSummary } from "@ucdjs/pipelines-ui/schemas";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { PipelineRow } from "./pipeline-row";

export function FileCard({ file, sourceId }: {
  file: SourceSummary["files"][number];
  sourceId: string;
}) {
  const previewPipelines = file.pipelines;
  const errorCount = file.errorCount;
  const hasFileError = file.hasErrors && file.pipelineCount === 0;

  return (
    <div className="rounded-md border border-border bg-muted/30 text-sm transition hover:border-primary/40 hover:bg-muted/50">
      <Link
        to="/$sourceId/$fileId"
        params={{ sourceId, fileId: file.fileId }}
        className="group block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="font-medium text-foreground group-hover:text-primary truncate">
              {file.fileLabel}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {file.filePath}
            </div>
          </div>
          {hasFileError
            ? (
                <div className="inline-flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 px-2 py-1 rounded-full shrink-0">
                  <AlertCircle className="h-3 w-3" />
                  {errorCount}
                  {" "}
                  error
                  {errorCount !== 1 ? "s" : ""}
                </div>
              )
            : (
                <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
                  {file.pipelineCount}
                  {" "}
                  pipeline
                  {file.pipelineCount !== 1 ? "s" : ""}
                </div>
              )}
        </div>
      </Link>

      {!hasFileError && file.pipelineCount > 0 && (
        <div className="px-2 pb-2 border-t border-border/60">
          {previewPipelines.map((pipeline) => (
            <PipelineRow
              key={pipeline.id}
              pipeline={pipeline}
              sourceId={sourceId}
              fileId={file.fileId}
            />
          ))}
          {file.pipelineCount > previewPipelines.length && (
            <Link
              to="/$sourceId/$fileId"
              params={{ sourceId, fileId: file.fileId }}
              className="block px-2 pt-1 text-[11px] text-muted-foreground hover:text-primary"
            >
              +
              {file.pipelineCount - previewPipelines.length}
              {" "}
              more
            </Link>
          )}
        </div>
      )}

      {hasFileError && (
        <div className="px-4 pb-3 text-xs text-destructive/90">
          This file could not be loaded. Open the file to review details.
        </div>
      )}
    </div>
  );
}
