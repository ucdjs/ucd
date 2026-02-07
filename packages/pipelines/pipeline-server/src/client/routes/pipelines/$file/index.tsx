import { createFileRoute, Link } from "@tanstack/react-router";
import { usePipelineFile } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/pipelines/$file/")({
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
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Pipeline File</h1>
        <p className="text-xs text-muted-foreground break-all">{fileInfo.filePath}</p>
      </div>
      <div className="space-y-2">
        {fileInfo.pipelines.map((pipeline) => (
          <Link
            key={pipeline.id}
            to="/pipelines/$file/$id"
            params={{ file, id: pipeline.id }}
            className="block rounded-md border border-border p-3 text-sm hover:bg-muted/50"
          >
            <div className="font-medium text-foreground">
              {pipeline.name || pipeline.id}
            </div>
            <div className="text-xs text-muted-foreground">
              {pipeline.versions.length}
              {" "}
              versions
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
