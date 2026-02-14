import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { usePipelineFile } from "@ucdjs/pipelines-ui";

export const Route = createLazyFileRoute("/pipelines/$file/")({
  component: PipelineFilePage,
});

function PipelineFilePage() {
  const { file } = Route.useParams();
  const { file: fileInfo, loading, error } = usePipelineFile(file);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground">Loading pipeline file...</p>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="flex-1 flex items-center justify-center" role="alert">
        <p className="text-sm text-muted-foreground">
          {error ?? "Pipeline file not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-lg border border-border bg-linear-to-br from-muted/50 via-muted/10 to-transparent p-4">
        <h1 className="text-lg font-semibold text-foreground">Pipeline File</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {fileInfo.fileLabel ?? fileInfo.filePath}
        </p>
        <p className="text-[11px] text-muted-foreground/80 break-all mt-1">
          {fileInfo.filePath}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fileInfo.pipelines.map((pipeline) => (
          <Link
            key={pipeline.id}
            to="/pipelines/$file/$id"
            params={{ file, id: pipeline.id }}
            className="group rounded-md border border-border bg-background/60 p-4 text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium text-foreground group-hover:text-primary">
                  {pipeline.name || pipeline.id}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pipeline.id}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                {pipeline.versions.length}
                {" "}
                versions
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
