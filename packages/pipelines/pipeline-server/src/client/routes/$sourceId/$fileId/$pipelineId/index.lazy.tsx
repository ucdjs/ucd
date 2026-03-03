import { QuickActionsPanel } from "#components/pipeline-overview/quick-actions";
import { RecentExecutionsPanel } from "#components/pipeline-overview/recent-executions-panel";
import { RecentOutputsPanel } from "#components/pipeline-overview/recent-outputs-panel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/")({
  component: PipelineOverviewPage,
});

function PipelineOverviewPage() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(executionsQueryOptions({
    sourceId: params.sourceId,
    fileId: params.fileId,
    pipelineId: params.pipelineId,
    limit: 10,
  }),
  );

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="p-6">
      <div className="grid gap-6 items-start lg:auto-rows-min lg:grid-cols-[minmax(420px,1fr)_minmax(240px,0.6fr)]">
        <div className="space-y-6">
          <QuickActionsPanel />
          <RecentOutputsPanel executions={data.executions} />
        </div>
        <div className="lg:row-span-2 lg:self-start">
          <RecentExecutionsPanel executions={data.executions} />
        </div>
      </div>
    </div>
  );
}
