import { sourceQueryOptions } from "#queries/source";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { FileCode2, FolderInput, FolderTree, Layers3, Spline, Workflow as PipelineIcon } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId } = Route.useParams();
  const { data: source } = useSuspenseQuery(sourceQueryOptions({ sourceId }));
  const file = source.files.find((file) => file.id === sourceFileId) ?? null;

  if (!file) {
    throw new Error(`File "${sourceFileId}" not found in source "${sourceId}"`);
  }

  const totalRouteCount = file.pipelines.reduce((count, pipeline) => count + pipeline.routeCount, 0);
  const totalSourceCount = file.pipelines.reduce((count, pipeline) => count + pipeline.sourceCount, 0);
  const uniqueVersions = new Set(file.pipelines.flatMap((pipeline) => pipeline.versions));

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-border bg-muted/20">
                  <FileCode2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{file.label}</CardTitle>
                  <CardDescription>{source.label}</CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <PipelineIcon className="h-3 w-3" />
                  {file.pipelines.length}
                  {" "}
                  pipeline
                  {file.pipelines.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="secondary">
                  <Spline className="h-3 w-3" />
                  {totalRouteCount}
                  {" "}
                  routes
                </Badge>
                <Badge variant="secondary">
                  <Layers3 className="h-3 w-3" />
                  {uniqueVersions.size}
                  {" "}
                  versions
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]">
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Path
                </div>
                <code className="block break-all rounded-lg border border-border/60 px-3 py-3 text-xs text-foreground">
                  {file.path}
                </code>
              </div>

              <Link
                to="/s/$sourceId"
                params={{ sourceId }}
                className="rounded-lg border border-border/60 px-3 py-3 transition-colors hover:bg-muted/10"
              >
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  <FolderInput className="h-3.5 w-3.5" />
                  Source
                </div>
                <div className="text-sm font-medium text-foreground">{source.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{source.id}</div>
              </Link>

              <div className="rounded-lg border border-border/60 px-3 py-3">
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  <FolderTree className="h-3.5 w-3.5" />
                  File totals
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <PipelineIcon className="h-3.5 w-3.5" />
                    <span className="font-medium tabular-nums text-foreground">{file.pipelines.length}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Spline className="h-3.5 w-3.5" />
                    <span className="font-medium tabular-nums text-foreground">{totalRouteCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FolderTree className="h-3.5 w-3.5" />
                    <span className="font-medium tabular-nums text-foreground">{totalSourceCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers3 className="h-3.5 w-3.5" />
                    <span className="font-medium tabular-nums text-foreground">{uniqueVersions.size}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Pipelines</CardTitle>
                <CardDescription>
                  {file.pipelines.length}
                  {" "}
                  pipeline
                  {file.pipelines.length === 1 ? "" : "s"}
                  {" "}
                  defined in this file
                </CardDescription>
              </div>
              <Badge variant="secondary">
                <PipelineIcon className="h-3 w-3" />
                {file.pipelines.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {file.pipelines.length === 0
              ? (
                  <div className="rounded-lg border border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                    No pipelines found in this file.
                  </div>
                )
              : (
                  <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    {file.pipelines.map((pipeline) => (
                      <Link
                        key={pipeline.id}
                        to="/s/$sourceId/$sourceFileId/$pipelineId"
                        params={{ sourceId, sourceFileId, pipelineId: pipeline.id }}
                        className="rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/10"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground">{pipeline.name || pipeline.id}</div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">{pipeline.id}</div>
                            </div>
                            <PipelineIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Layers3 className="h-3.5 w-3.5" />
                              <span className="font-medium tabular-nums text-foreground">{pipeline.versions.length}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Spline className="h-3.5 w-3.5" />
                              <span className="font-medium tabular-nums text-foreground">{pipeline.routeCount}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <FolderTree className="h-3.5 w-3.5" />
                              <span className="font-medium tabular-nums text-foreground">{pipeline.sourceCount}</span>
                            </span>
                          </div>

                          {pipeline.versions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {pipeline.versions.slice(0, 3).map((version) => (
                                <Badge key={version} variant="secondary" className="text-[11px]">
                                  {version}
                                </Badge>
                              ))}
                              {pipeline.versions.length > 3 && (
                                <Badge variant="secondary" className="text-[11px]">
                                  +
                                  {pipeline.versions.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </section>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
