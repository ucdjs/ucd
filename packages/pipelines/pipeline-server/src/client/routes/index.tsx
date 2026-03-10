import { ExecutionTable } from "#components/execution/execution-table";
import { ExecutionActivityChart } from "#components/overview/activity-chart";
import { SourcesPanel } from "#components/overview/sources-panel";
import { StatusOverviewPanel } from "#components/overview/status-overview-panel";
import { configQueryOptions } from "#queries/config";
import { overviewQueryOptions } from "#queries/overview";
import { sourcesQueryOptions } from "#queries/sources";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    return {
      overview: await context.queryClient.ensureQueryData(overviewQueryOptions()),
    };
  },
  component: HomePage,
});

function HomePage() {
  const { overview } = Route.useLoaderData();
  const { data: sources } = useSuspenseQuery(sourcesQueryOptions());
  const { data: config } = useSuspenseQuery(configQueryOptions({ baseUrl: "" }));
  const sourceCount = sources.length;
  const pipelineCount = sources.reduce((sum, source) => sum + source.pipelineCount, 0);
  const fileCount = sources.reduce((sum, source) => sum + source.fileCount, 0);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="grid w-full gap-4 p-6">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {config.data?.workspaceId && <Badge variant="secondary">{config.data.workspaceId}</Badge>}
              {config.data?.version && <Badge variant="outline">{config.data.version}</Badge>}
              <span>Last 7 days</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Pipeline dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {sourceCount}
              {" "}
              sources
            </Badge>
            <Badge variant="outline">
              {fileCount}
              {" "}
              files
            </Badge>
            <Badge variant="outline">
              {pipelineCount}
              {" "}
              pipelines
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <ExecutionActivityChart
            activity={overview.activity}
            summaryStates={overview.summary}
          />
          <StatusOverviewPanel
            summaryStates={overview.summary}
            total={overview.summary.total}
          />
          <Card className="xl:col-span-8">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base">Recent executions</CardTitle>
              <CardDescription>Latest activity across the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ExecutionTable
                executions={overview.recentExecutions}
                emptyTitle="No executions recorded yet."
              />
            </CardContent>
          </Card>
          <SourcesPanel sources={sources} />
        </div>
      </div>
    </div>
  );
}
