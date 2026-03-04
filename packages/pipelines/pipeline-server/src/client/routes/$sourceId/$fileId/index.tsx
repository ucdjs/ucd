import { PipelineCard } from "#components/file-home/pipeline-card";
import { ErrorsPanel } from "#components/source-home/errors-panel";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AlertCircle, GitBranch, Route as RouteIcon } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/$sourceId/$fileId/")({
  component: FilePipelinesPage,
  notFoundComponent: SourceFileNotFound,
});

function FilePipelinesPage() {
  const { file, errors } = useLoaderData({ from: "/$sourceId/$fileId" });
  const { sourceId, fileId } = Route.useParams();

  const totalRoutes = useMemo(
    () => file.pipelines.reduce((sum, p) => sum + p.routeCount, 0),
    [file.pipelines],
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">
          {file.fileLabel}
        </h1>
        <p className="text-xs text-muted-foreground/80 break-all mt-0.5">
          {file.filePath}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="w-3 h-3" />
            {file.pipelines.length}
            {" "}
            pipeline
            {file.pipelines.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <RouteIcon className="w-3 h-3" />
            {totalRoutes}
            {" "}
            route
            {totalRoutes !== 1 ? "s" : ""}
          </span>
          {errors.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              {errors.length}
              {" "}
              error
              {errors.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {errors.length > 0 && <ErrorsPanel errors={errors} />}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Pipelines</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {file.pipelines.map((pipeline) => (
              <PipelineCard
                key={pipeline.id}
                pipeline={pipeline}
                sourceId={sourceId}
                fileId={fileId}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SourceFileNotFound() {
  const { sourceId } = Route.useParams();

  return (
    <div className="flex-1 flex items-center justify-center" role="alert">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">File not found</p>
        <p className="text-sm text-muted-foreground mt-2">
          The file with ID
          {" "}
          <code className="bg-muted/50 px-1 rounded">{sourceId}</code>
          {" "}
          could not be found.
        </p>
      </div>
    </div>
  );
}
