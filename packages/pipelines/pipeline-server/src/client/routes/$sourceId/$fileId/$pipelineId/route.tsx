import { PipelineHeader } from "#components/pipeline-header";
import { PipelineTabs } from "#components/pipeline-tabs";
import { PipelineVersionBar } from "#components/pipeline-version-bar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { Suspense } from "react";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId")({
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(
      pipelineQueryOptions({
        sourceId: params.sourceId,
        fileId: params.fileId,
        pipelineId: params.pipelineId,
      }),
    );
  },
  notFoundComponent: NotFoundComponent,
  component: PipelineDetailLayout,
});

function PipelineDetailLayout() {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border shrink-0">
        <Suspense fallback={<PipelineHeader.Skeleton />}>
          <PipelineHeader />
        </Suspense>
        <Suspense fallback={<PipelineVersionBar.Skeleton />}>
          <PipelineVersionBar />
        </Suspense>
        <PipelineTabs />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const { sourceId, fileId, pipelineId } = Route.useParams();

  return (
    <div className="flex-1 flex items-center justify-center" role="alert">
      <div className="text-center max-w-md mx-auto p-6">
        <p className="text-sm text-destructive mb-2">Pipeline not found</p>
        <p className="text-xs text-muted-foreground">
          Pipeline:
          {" "}
          {sourceId}
          /
          {fileId}
          /
          {pipelineId}
        </p>
      </div>
    </div>
  );
}
