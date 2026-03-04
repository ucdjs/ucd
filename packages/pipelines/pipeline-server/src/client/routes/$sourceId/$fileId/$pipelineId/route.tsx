import type { NotFoundRouteProps } from "@tanstack/react-router";
import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { PipelineVersionBar } from "#components/pipeline-version-bar";
import { createFileRoute, Link, notFound, Outlet } from "@tanstack/react-router";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui/functions";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      pipelineQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
      }),
    );

    if (!data || !data.pipeline) {
      throw notFound({ data: { sourceId: params.sourceId, fileId: params.fileId, pipelineId: params.pipelineId } });
    }
  },
  notFoundComponent: NotFoundComponent,
  component: PipelineDetailLayout,
  pendingComponent: PipelineLayoutPending,
});

function PipelineDetailLayout() {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <PipelineHeader />
        <PipelineVersionBar />
        <PipelineTabs />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}

function PipelineLayoutPending() {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <PipelineHeader.Skeleton />
        <PipelineVersionBar.Skeleton />
        <PipelineTabs />
      </div>

      <div className="flex-1 overflow-auto min-h-0" />
    </div>
  );
}

function NotFoundComponent(props: NotFoundRouteProps) {
  const params = props.data as { sourceId: string; fileId: string; pipelineId: string } | undefined;

  return (
    <div className="flex-1 flex items-center justify-center p-8" role="alert">
      <div className="text-center max-w-md space-y-3">
        <p className="text-sm font-medium text-foreground">Pipeline not found</p>
        {params
          ? (
              <>
                <p className="text-xs text-muted-foreground">
                  The pipeline
                  {" "}
                  <code className="bg-muted/50 px-1 rounded">{params.pipelineId}</code>
                  {" "}
                  could not be found in
                  {" "}
                  <code className="bg-muted/50 px-1 rounded">
                    {params.sourceId}
                    /
                    {params.fileId}
                  </code>
                  .
                </p>
                <Link
                  to="/$sourceId/$fileId"
                  params={{ sourceId: params.sourceId, fileId: params.fileId }}
                  className="inline-flex items-center text-xs text-primary hover:underline"
                >
                  Back to file
                </Link>
              </>
            )
          : (
              <p className="text-xs text-muted-foreground">
                This pipeline does not exist.
              </p>
            )}
      </div>
    </div>
  );
}
