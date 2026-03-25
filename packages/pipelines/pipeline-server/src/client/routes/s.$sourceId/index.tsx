import { StatusIcon } from "#components/execution/status-icon";
import { ExecutionActivityChart } from "#components/overview/activity-chart";
import { StatusOverview } from "#components/overview/status-overview";
import { PipelineFileCard } from "#components/source/pipeline-file-card";
import { PipelineFileRow } from "#components/source/pipeline-file-row";
import { SourceIssuesDialog } from "#components/source/source-issues-dialog";
import { formatExecutionDuration, formatStartedAt } from "#lib/format";
import { sourceQueryOptions } from "#queries/source";
import { sourceOverviewQueryOptions } from "#queries/source-overview";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { AlertTriangle, FileCode2, LayoutGrid, LayoutList, Workflow as PipelineIcon, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/s/$sourceId/")({
  loader: async ({ context, params }) => {
    const [source] = await Promise.all([
      context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId })),
      context.queryClient.prefetchQuery(sourceOverviewQueryOptions({ sourceId: params.sourceId })),
    ]);
    return { source };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId } = Route.useParams();
  const { source } = Route.useLoaderData();
  const { data: overview } = useSuspenseQuery(sourceOverviewQueryOptions({ sourceId }));
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const totalPipelines = source.files.reduce((sum, file) => sum + file.pipelines.length, 0);

  const filtered = useMemo(() => {
    if (!search) return source.files;
    const lower = search.toLowerCase();
    return source.files
      .map((file) => {
        const fileMatches = file.label.toLowerCase().includes(lower) || file.path.toLowerCase().includes(lower);
        const matchingPipelines = file.pipelines.filter(
          (p) => (p.name || p.id).toLowerCase().includes(lower) || p.id.toLowerCase().includes(lower),
        );
        if (fileMatches) return file;
        if (matchingPipelines.length > 0) return { ...file, pipelines: matchingPipelines };
        return null;
      })
      .filter(Boolean) as typeof source.files;
  }, [source.files, search]);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{source.label}</h1>
            <Badge variant="secondary" className="text-[11px] shrink-0">{source.type}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5" />
              {source.files.length}
              {" "}
              files
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PipelineIcon className="h-3.5 w-3.5" />
              {totalPipelines}
              {" "}
              pipelines
            </span>
          </div>
        </div>
      </div>

      {source.errors.length > 0 && (
        <div className="mx-6 mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="font-medium text-destructive">
                {source.errors.length}
                {" "}
                {source.errors.length === 1 ? "issue" : "issues"}
                {" "}
                detected
              </span>
            </div>
            <SourceIssuesDialog
              issues={source.errors}
              title={`${source.label} issues`}
              description="Detailed source loading issues for this source."
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 p-6 lg:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-md">
          <ExecutionActivityChart
            activity={overview.activity}
            summaryStates={overview.summary}
            compact
          />
          <StatusOverview
            summaryStates={overview.summary}
            total={overview.summary.total}
          />
          <Card>
            <CardHeader className="border-b border-border/60 pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Recent executions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {overview.recentExecutions.length === 0
                ? (
                    <div className="px-4 py-8 text-center">
                      <Play className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">No executions yet</p>
                    </div>
                  )
                : (
                    <div>
                      {overview.recentExecutions.map((execution, idx) => {
                        const canView = execution.sourceId != null && execution.fileId != null && execution.pipelineId != null;
                        const content = (
                          <div className={`flex items-center gap-3 px-4 py-2.5${idx > 0 ? " border-t border-border/30" : ""}`}>
                            <StatusIcon status={execution.status} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">{execution.pipelineId}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {formatStartedAt(execution.startedAt)}
                                {" · "}
                                {formatExecutionDuration(execution.startedAt, execution.completedAt)}
                              </div>
                            </div>
                            {execution.versions && execution.versions.length > 0 && (
                              <Badge variant="secondary" className="shrink-0 text-[10px]">
                                {execution.versions[0]}
                              </Badge>
                            )}
                          </div>
                        );

                        if (canView) {
                          return (
                            <Link
                              key={execution.id}
                              to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                              params={{
                                sourceId: execution.sourceId!,
                                sourceFileId: execution.fileId!,
                                pipelineId: execution.pipelineId,
                                executionId: execution.id,
                              }}
                              className="block transition-colors hover:bg-muted/30"
                            >
                              {content}
                            </Link>
                          );
                        }

                        return <div key={execution.id}>{content}</div>;
                      })}
                    </div>
                  )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files and pipelines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-card py-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
              />
            </div>
            <div className="flex shrink-0 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label="List view"
                className={`inline-flex items-center justify-center rounded-l-lg px-2.5 py-2 transition-colors${viewMode === "list" ? " bg-muted text-foreground" : " text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Grid view"
                className={`inline-flex items-center justify-center rounded-r-lg border-l border-border/60 px-2.5 py-2 transition-colors${viewMode === "grid" ? " bg-muted text-foreground" : " text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            {filtered.length === 0
              ? (
                  <div className="rounded-lg border border-dashed border-border/60 px-6 py-16 text-center text-sm text-muted-foreground">
                    {search ? `No results for "${search}"` : "No files found in this source."}
                  </div>
                )
              : viewMode === "list"
                ? (
                    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                      {filtered.map((file, idx) => (
                        <div key={file.id} className={idx > 0 ? "border-t border-border/60" : ""}>
                          <PipelineFileRow file={file} sourceId={sourceId} />
                        </div>
                      ))}
                    </div>
                  )
                : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {filtered.map((file) => (
                        <PipelineFileCard key={file.id} file={file} sourceId={sourceId} />
                      ))}
                    </div>
                  )}
          </div>
        </div>
      </div>
    </div>
  );
}
