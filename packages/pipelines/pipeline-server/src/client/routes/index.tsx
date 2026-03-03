import type { ExecutionInfo, OverviewResponse, SourceInfo } from "@ucdjs/pipelines-ui";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import {
  ActivitySparkline,
  RecentExecutionsList,
  SetupWizard,
  SourceCards,
  SystemOverview,
} from "@ucdjs/pipelines-ui";
import { overviewQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(overviewQueryOptions({ baseUrl: "" }));
  },
  component: HomePage,
});

function HomePage() {
  const { sources } = useLoaderData({ from: "__root__" });
  const overview = useLoaderData({ from: "/" }) as OverviewResponse;

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

  const activityData = overview.activity;
  const recentExecutions: ExecutionInfo[] = overview.recentExecutions.map((exec) => ({
    ...exec,
    sourceId: "",
    fileId: "",
  }));

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Stats Overview */}
      <section>
        <SystemOverview
          totalSources={overview.stats.totalSources}
          totalFiles={overview.stats.totalFiles}
          totalPipelines={overview.stats.totalPipelines}
          totalExecutions={overview.stats.totalExecutions}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivitySparkline data={activityData} />
        <SourceCards sources={sourceData} />
      </section>

      <section>
        <RecentExecutionsList executions={recentExecutions} />
      </section>
    </div>
  );
}
