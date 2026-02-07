import type { PipelineResponse } from "@ucdjs/pipelines-ui";
import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { createFileRoute, notFound, Outlet, useLoaderData, useParams } from "@tanstack/react-router";
import { usePipelineVersions, VersionSelector } from "@ucdjs/pipelines-ui";

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
  notFoundComponent: NotFoundComponent,
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
        <Outlet />
      </div>
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
