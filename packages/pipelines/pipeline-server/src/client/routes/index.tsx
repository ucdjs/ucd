import type { SourceInfo } from "@ucdjs/pipelines-ui";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import {
  ActivitySparkline,
  RecentExecutionsList,
  SetupWizard,
  SourceCards,
  SystemOverview,
} from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// Demo data - replace with real data from API
const demoActivityData = [
  { date: "2025-02-22", total: 12, success: 10, failed: 2 },
  { date: "2025-02-23", total: 18, success: 16, failed: 2 },
  { date: "2025-02-24", total: 8, success: 7, failed: 1 },
  { date: "2025-02-25", total: 24, success: 22, failed: 2 },
  { date: "2025-02-26", total: 15, success: 14, failed: 1 },
  { date: "2025-02-27", total: 32, success: 30, failed: 2 },
  { date: "2025-02-28", total: 28, success: 26, failed: 2 },
];

const demoExecutions = [
  { id: "1", pipelineId: "p1", pipelineName: "Pipeline A", sourceId: "local", fileId: "f1", status: "completed" as const, startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: "2", pipelineId: "p2", pipelineName: "Pipeline B", sourceId: "github", fileId: "f2", status: "failed" as const, startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "3", pipelineId: "p3", pipelineName: "Pipeline C", sourceId: "local", fileId: "f3", status: "running" as const, startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
];

function HomePage() {
  const { sources } = useLoaderData({ from: "__root__" });

  // Show setup wizard if no sources configured
  if (!sources || sources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <SetupWizard />
      </div>
    );
  }

  // Transform sources to include demo counts
  const sourceData: SourceInfo[] = sources.map((s: { id: string; type: string }) => ({
    id: s.id,
    type: s.type as "local" | "github" | "gitlab",
    fileCount: Math.floor(Math.random() * 10) + 1,
    pipelineCount: Math.floor(Math.random() * 20) + 1,
    errorCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
  }));

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Stats Overview */}
      <section>
        <SystemOverview
          totalSources={sources.length}
          totalFiles={sourceData.reduce((sum, s) => sum + (s.fileCount ?? 0), 0)}
          totalPipelines={sourceData.reduce((sum, s) => sum + (s.pipelineCount ?? 0), 0)}
          totalExecutions={demoActivityData.reduce((sum, d) => sum + d.total, 0)}
        />
      </section>

      {/* Middle Row: Activity + Source Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivitySparkline data={demoActivityData} />
        <SourceCards
          sources={sourceData}
          onSourceClick={(sourceId) => {
            // Navigate to source detail
            console.log("Navigate to:", sourceId);
          }}
        />
      </section>

      {/* Bottom Row: Recent Executions */}
      <section>
        <RecentExecutionsList
          executions={demoExecutions}
          onExecutionClick={(execution) => {
            // Navigate to execution detail
            console.log("Navigate to execution:", execution);
          }}
        />
      </section>
    </div>
  );
}
