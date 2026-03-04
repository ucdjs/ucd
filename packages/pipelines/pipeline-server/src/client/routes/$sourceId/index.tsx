import { ErrorsPanel } from "#components/source-home/errors-panel";
import { FileCard } from "#components/source-home/file-card";
import { SourceOverview } from "#components/source-home/source-overview";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/$sourceId/")({
  component: SourceFilesPage,
});

function SourceFilesPage() {
  const source = useLoaderData({ from: "/$sourceId" });
  const { sourceId } = Route.useParams();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">{sourceId}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <Suspense fallback={<SourceOverview.Skeleton />}>
            <SourceOverview sourceId={sourceId} />
          </Suspense>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {source.errors.length > 0 && <ErrorsPanel errors={source.errors} />}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Files</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {source.files.map((file) => (
              <FileCard key={file.fileId} file={file} sourceId={sourceId} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
