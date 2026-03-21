import { ExecutionTable } from "#components/execution/execution-table";
import { ExecutionActivityChart } from "#components/home/activity-chart";
import { SourcesPanel } from "#components/home/sources-panel";
import { StatusOverviewPanel } from "#components/home/status-overview-panel";
import { overviewQueryOptions } from "#queries/overview";
import { sourcesQueryOptions } from "#queries/sources";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { FileCode2, FolderTree, Workflow as PipelineIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    context.queryClient.prefetchQuery(overviewQueryOptions());
  },
  component: HomePage,
});

function HomePage() {
  const { data: sources } = useSuspenseQuery(sourcesQueryOptions());
  const { data: overview } = useSuspenseQuery(overviewQueryOptions());
  const sourceCount = sources.length;
  const pipelineCount = sources.reduce((sum, source) => sum + source.pipelineCount, 0);
  const fileCount = sources.reduce((sum, source) => sum + source.fileCount, 0);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="grid w-full gap-4 p-6">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              <FolderTree className="h-3 w-3" />
              {sourceCount}
              {" "}
              sources
            </Badge>
            <Badge variant="outline">
              <FileCode2 className="h-3 w-3" />
              {fileCount}
              {" "}
              files
            </Badge>
            <Badge variant="outline">
              <PipelineIcon className="h-3 w-3" />
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
          <section className="xl:col-span-8 rounded-xl border border-border/60 bg-background">
            <header className="border-b border-border/60 px-5 py-4">
              <h2 className="text-base font-semibold tracking-tight">Recent executions</h2>
              <p className="text-sm text-muted-foreground">Latest activity across the workspace.</p>
            </header>
            <ExecutionTable
              executions={overview.recentExecutions}
              emptyTitle="No executions recorded yet."
            />
          </section>
          <SourcesPanel sources={sources} />
        </div>
      </div>
    </div>
  );
}
