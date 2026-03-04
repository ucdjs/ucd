import type { SourceDetail } from "@ucdjs/pipelines-ui/schemas";
import { Link } from "@tanstack/react-router";
import { PipelineRow } from "./pipeline-row";

const MAX_VISIBLE_PIPELINES = 5;
export function FileCard({ file, sourceId }: {
  file: SourceDetail["files"][number];
  sourceId: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 text-sm transition hover:border-primary/40 hover:bg-muted/50">
      <Link
        to="/$sourceId/$fileId"
        params={{ sourceId, fileId: file.fileId }}
        className="group block p-4 pb-2"
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
          <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
            {file.pipelines.length}
            {" "}
            pipeline
            {file.pipelines.length !== 1 ? "s" : ""}
          </div>
        </div>
      </Link>

      {file.pipelines.length > 0 && (
        <div className="border-t border-border/50 px-4 py-2 divide-y divide-border/40">
          {file.pipelines.slice(0, MAX_VISIBLE_PIPELINES).map((pipeline) => (
            <PipelineRow
              key={pipeline.id}
              pipeline={pipeline}
              sourceId={sourceId}
              fileId={file.fileId}
            />
          ))}
          {file.pipelines.length > MAX_VISIBLE_PIPELINES && (
            <Link
              to="/$sourceId/$fileId"
              params={{ sourceId, fileId: file.fileId }}
              className="block text-xs text-muted-foreground hover:text-primary py-1 text-center"
            >
              +
              {file.pipelines.length - MAX_VISIBLE_PIPELINES}
              {" "}
              more pipeline
              {file.pipelines.length - MAX_VISIBLE_PIPELINES !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
