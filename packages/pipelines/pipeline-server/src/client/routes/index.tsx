import type { ExecutionInfo, SourceInfo } from "@ucdjs/pipelines-ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ActivitySparkline, RecentExecutionsList, SetupWizard, SourceCards } from "@ucdjs/pipelines-ui";
import { overviewQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { FolderGit2 } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(overviewQueryOptions({ baseUrl: "" }));
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
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-background to-muted/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Workspace Overview</h1>
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
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={(props) => (
                <Link to="/$sourceId" params={{ sourceId: sourceData[0]?.id ?? "" }} {...props}>
                  <span className="flex items-center gap-2">
                    Browse pipelines
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
          <ActivitySparkline data={overview.activity} variant="epic" />
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
    <div className="flex-1 p-6 text-sm text-muted-foreground">
      Loading overview...
    </div>
  );
}
