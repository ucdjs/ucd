import { QuickActionsPanel } from "#components/pipeline-overview/quick-actions";
import { RecentExecutionsPanel } from "#components/pipeline-overview/recent-executions-panel";
import { RecentOutputsPanel } from "#components/pipeline-overview/recent-outputs-panel";
import { fetchExecutions } from "#lib/pipeline-executions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pipelines/$file/$id/")({
  component: PipelineOverviewPage,
  loader: async ({ params }) => {
    const executions = await fetchExecutions(params.file, params.id);
    return { executions };
  },
});

function PipelineOverviewPage() {
  const { executions } = Route.useLoaderData();

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="p-6">
      <div className="grid gap-6 items-start lg:auto-rows-min lg:grid-cols-[minmax(420px,1fr)_minmax(240px,0.6fr)]">
        <div className="space-y-6">
          <QuickActionsPanel />
          <RecentOutputsPanel executions={executions.executions} />
        </div>
        <div className="lg:row-span-2 lg:self-start">
          <RecentExecutionsPanel executions={executions.executions} />
        </div>
      </div>
    </div>
  );
}
