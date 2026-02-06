import type { PipelineResponse } from "@ucdjs/pipelines-ui";
import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { createFileRoute, notFound, Outlet, useLoaderData, useParams } from "@tanstack/react-router";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { usePipelineVersions, VersionSelector } from "@ucdjs/pipelines-ui";
import { Suspense } from "react";

export const Route = createFileRoute("/pipelines/$id")({
  loader: async ({ params }) => {
    const res = await fetch(`/api/pipelines/${params.id}`);

    if (!res.ok) {
      if (res.status === 404) {
        throw notFound();
      }
      throw new Error(`Failed to load pipeline (${res.status})`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data as PipelineResponse;
  },
  pendingComponent: PendingComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  component: PipelineDetailLayout,
});

function PipelineDetailLayout() {
  const { id } = useParams({ from: "/pipelines/$id" });
  const data = useLoaderData({ from: "/pipelines/$id" });
  const pipeline = data.pipeline;
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(
    id,
    pipeline?.versions || [],
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <PipelineHeader />
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <VersionSelector
            versions={pipeline?.versions || []}
            selectedVersions={selectedVersions}
            onToggleVersion={toggleVersion}
            onSelectAll={() => selectAll(pipeline?.versions || [])}
            onDeselectAll={deselectAll}
          />
        </div>
        <PipelineTabs />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <Suspense fallback={<PipelineContentSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

function PipelineContentSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,1fr)_minmax(250px,0.8fr)]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-24" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-24" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingComponent() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PipelineContentSkeleton />
    </div>
  );
}

function NotFoundComponent() {
  const { id } = Route.useParams();

  return (
    <div className="flex-1 flex items-center justify-center" role="alert">
      <div className="text-center max-w-md mx-auto p-6">
        <p className="text-sm text-destructive mb-2">Pipeline not found</p>
        <p className="text-xs text-muted-foreground">
          Pipeline ID:
          {id}
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  const { id } = Route.useParams();

  return (
    <div className="flex-1 flex items-center justify-center" role="alert">
      <div className="text-center max-w-md mx-auto p-6">
        <p className="text-sm text-destructive mb-2">{error.message}</p>
        <p className="text-xs text-muted-foreground">
          Pipeline ID:
          {id}
        </p>
      </div>
    </div>
  );
}
