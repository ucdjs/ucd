import type { ExecutionInfo, SourceInfo } from "@ucdjs/pipelines-ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ActivityBarChart, RecentExecutionsList, SetupWizard, SourceCards } from "@ucdjs/pipelines-ui";
import { overviewQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { FolderGit2 } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(overviewQueryOptions({ baseUrl: "" }));
  },
  component: HomePage,
  pendingComponent: HomePagePending,
});

function HomePage() {
  const { sources } = useLoaderData({ from: "__root__" });
  const { data: overview } = useSuspenseQuery(
    overviewQueryOptions({ baseUrl: "" }),
  );

  // Show setup wizard if no sources configured
  if (!sources || sources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <SetupWizard />
      </div>
    );
  }

  const sourceData: SourceInfo[] = overview.stats.sources.map((source) => ({
    id: source.id,
    type: source.type as "local" | "github" | "gitlab",
    fileCount: source.fileCount,
    pipelineCount: source.pipelineCount,
    errorCount: source.errorCount,
  }));

  const recentExecutions: ExecutionInfo[] = overview.recentExecutions.map((exec) => ({
    ...exec,
    sourceId: "",
    fileId: "",
  }));

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <section className="rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              nativeButton={false}
              render={(props) => (
                <Link to="/$sourceId" params={{ sourceId: sourceData[0]?.id ?? "" }} {...props}>
                  <span className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4" />
                    Browse sources
                  </span>
                </Link>
              )}
              disabled={sourceData.length === 0}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityBarChart data={overview.activity} variant="epic" />
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent executions</CardTitle>
              <span className="text-xs text-muted-foreground">Last 4 runs</span>
            </div>
          </CardHeader>
          <RecentExecutionsList
            executions={recentExecutions}
            maxItems={4}
            contentClassName="pt-0"
            dense
            showStatusLabel={false}
            compactMeta
          />
        </Card>

        <div className="lg:col-span-2">
          <SourceCards sources={sourceData} compact />
        </div>

        <Card className="self-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totals</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">Sources</div>
              <div className="text-lg font-semibold">{overview.stats.totalSources}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">Pipelines</div>
              <div className="text-lg font-semibold">{overview.stats.totalPipelines}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">Files</div>
              <div className="text-lg font-semibold">{overview.stats.totalFiles}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">Executions</div>
              <div className="text-lg font-semibold">{overview.stats.totalExecutions}</div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function HomePagePending() {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <section className="rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="w-32 h-7 rounded bg-muted animate-pulse" />
          <span className="w-28 h-8 rounded-md bg-muted animate-pulse" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card p-6">
          <span className="block w-28 h-4 rounded bg-muted animate-pulse mb-4" />
          <div className="h-48 rounded bg-muted animate-pulse" />
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="w-32 h-4 rounded bg-muted animate-pulse" />
            <span className="w-16 h-3 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`exec-sk-${i}`} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1">
                  <span className="block w-24 h-3 rounded bg-muted animate-pulse" />
                  <span className="block w-16 h-2.5 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`src-sk-${i}`} className="rounded-xl border bg-card p-4 space-y-2">
              <span className="block w-20 h-4 rounded bg-muted animate-pulse" />
              <span className="block w-32 h-3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-6 self-start">
          <span className="block w-16 h-4 rounded bg-muted animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`tot-sk-${i}`} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <span className="block w-14 h-2.5 rounded bg-muted animate-pulse" />
                <span className="block w-8 h-5 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
