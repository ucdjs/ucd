import { createLazyFileRoute, Link, useLoaderData } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/$sourceId/$fileId/")({
  component: FilePipelinesPage,
});

function FilePipelinesPage() {
  const { fileData } = useLoaderData({ from: "/$sourceId/$fileId" });
  const { sourceId, fileId } = Route.useParams();

  if (!fileData?.file) {
    return (
      <div className="flex-1 flex items-center justify-center" role="alert">
        <p className="text-sm text-muted-foreground">File not found</p>
      </div>
    );
  }

  const fileInfo = fileData.file;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Pipeline File</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {fileInfo.fileLabel ?? fileInfo.filePath}
        </p>
        <p className="text-[11px] text-muted-foreground/80 break-all mt-1">
          {fileInfo.filePath}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fileInfo.pipelines.map((pipeline) => (
            <Link
              key={pipeline.id}
              to="/$sourceId/$fileId/$pipelineId"
              params={{ sourceId, fileId, pipelineId: pipeline.id }}
              className="group rounded-md border border-border bg-muted/30 p-4 text-sm transition hover:border-primary/40 hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="font-medium text-foreground group-hover:text-primary truncate">
                    {pipeline.name || pipeline.id}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {pipeline.id}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
                  {pipeline.versions.length}
                  {" "}
                  versions
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
