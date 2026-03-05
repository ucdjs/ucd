import { PipelineCard } from "#components/file-home/pipeline-card";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { PipelineErrorsBanner } from "@ucdjs/pipelines-ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { AlertCircle, GitBranch, Route as RouteIcon } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/$sourceId/$fileId/")({
  component: FilePipelinesPage,
});

function FilePipelinesPage() {
  const { file } = useLoaderData({ from: "/$sourceId/$fileId" });
  const { sourceId, fileId } = Route.useParams();
  const fileErrors = file.errors ?? [];
  const allFailed = fileErrors.length > 0 && file.pipelines.length === 0;

  const totalRoutes = useMemo(
    () => file.pipelines.reduce((sum, p) => sum + p.routeCount, 0),
    [file.pipelines],
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4 shrink-0">
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/$sourceId" params={{ sourceId }} />}>
                {sourceId}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{file.fileLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
          {fileErrors.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              {fileErrors.length}
              {" "}
              error
              {fileErrors.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <PipelineErrorsBanner
          errors={fileErrors}
          scope="file"
          targetLabel={file.fileLabel}
          allFailed={allFailed}
        />

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Pipelines</h2>
          {file.pipelines.length > 0
            ? (
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
              )
            : (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  {allFailed
                    ? "No pipelines are available because this file failed to load."
                    : "No pipelines found for this file."}
                </div>
              )}
        </section>
      </div>
    </div>
  );
}
