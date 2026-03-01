import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";

export const Route = createFileRoute("/$sourceId/")({
  component: SourcePage,
});

function SourcePage() {
  const { sourceId, files } = useLoaderData({ from: "/$sourceId" });
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Source</h1>
        <p className="text-xs text-muted-foreground mt-1">{sourceId}</p>
        <p className="text-[11px] text-muted-foreground/80 mt-1">
          {files.length}
          {" "}
          file
          {files.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => {
          const fileName = file.fileLabel ?? file.filePath.split("/").pop() ?? file.filePath;

          return (
            <Link
              key={file.fileId}
              to="/$sourceId/$fileId"
              params={{ sourceId, fileId: file.fileId }}
              className="group rounded-md border border-border bg-background/60 p-4 text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium text-foreground group-hover:text-primary">
                    {fileName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.filePath}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                  {file.pipelines.length}
                  {" "}
                  versions
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
