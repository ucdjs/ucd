import { QuickActionsPanel } from "#components/pipeline-overview/quick-actions";
import { RecentExecutionsPanel } from "#components/pipeline-overview/recent-executions-panel";
import { RecentOutputsPanel } from "#components/pipeline-overview/recent-outputs-panel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { executionsQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/")({
  loader: async ({ context, params }) => {
    context.queryClient.prefetchQuery(executionsQueryOptions({
      sourceId: params.sourceId,
      fileId: params.fileId,
      pipelineId: params.pipelineId,
      limit: 50,
    }));
  },
  component: PipelineOverviewPage,
  pendingComponent: PipelineOverviewSkeleton,
});

function PipelineOverviewPage() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(executionsQueryOptions({
    sourceId: params.sourceId,
    fileId: params.fileId,
    pipelineId: params.pipelineId,
    limit: 10,
  }));

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

function PipelineOverviewSkeleton() {
  return (
    <div className="p-6">
      <div className="grid gap-6 items-start lg:auto-rows-min lg:grid-cols-[minmax(420px,1fr)_minmax(240px,0.6fr)]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="space-y-1.5">
              <span className="block w-28 h-4 rounded bg-muted animate-pulse" />
              <span className="block w-48 h-3 rounded bg-muted animate-pulse" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <span className="h-9 rounded-md bg-muted animate-pulse" />
              <span className="h-9 rounded-md bg-muted animate-pulse" />
              <span className="h-9 rounded-md bg-muted animate-pulse" />
              <span className="h-9 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="block w-28 h-4 rounded bg-muted animate-pulse" />
                <span className="block w-48 h-3 rounded bg-muted animate-pulse" />
              </div>
              <span className="w-14 h-3 rounded bg-muted animate-pulse" />
            </div>
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={`output-${i}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-28 h-3 rounded bg-muted animate-pulse" />
                      <span className="w-14 h-4 rounded-full bg-muted animate-pulse" />
                    </div>
                    <span className="block w-24 h-3 rounded bg-muted animate-pulse" />
                  </div>
                  <span className="w-10 h-3 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:row-span-2 lg:self-start rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="block w-36 h-4 rounded bg-muted animate-pulse" />
              <span className="block w-28 h-3 rounded bg-muted animate-pulse" />
            </div>
            <span className="w-14 h-3 rounded bg-muted animate-pulse" />
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`exec-${i}`} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <span className="block w-24 h-3 rounded bg-muted animate-pulse" />
                    <span className="block w-32 h-3 rounded bg-muted animate-pulse" />
                  </div>
                </div>
                <span className="w-10 h-3 rounded bg-muted animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
