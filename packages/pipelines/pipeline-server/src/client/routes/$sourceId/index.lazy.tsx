import { createLazyFileRoute, Link, useLoaderData } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/$sourceId/")({
  component: SourceFilesPage,
});

function SourceFilesPage() {
  const source = useLoaderData({ from: "/$sourceId" });
  const { sourceId } = Route.useParams();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Source Files</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {source.files.length}
          {" "}
          file
          {source.files.length !== 1 ? "s" : ""}
          {" "}
          in
          {sourceId}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {source.files.map((file) => (
            <Link
              key={file.fileId}
              to="/$sourceId/$fileId"
              params={{ sourceId, fileId: file.fileId }}
              className="group rounded-md border border-border bg-muted/30 p-4 text-sm transition hover:border-primary/40 hover:bg-muted/50"
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
          ))}
        </div>
      </div>
    </div>
  );
}
