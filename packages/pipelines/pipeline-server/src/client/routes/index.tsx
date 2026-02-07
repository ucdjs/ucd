import { createFileRoute } from "@tanstack/react-router";
import { usePipelines } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function EmptyStateIcon() {
  return (
    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-6 h-6 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    </div>
  );
}

function SelectPipelinePrompt() {
  return (
    <>
      <EmptyStateIcon />
      <h2 className="text-lg font-medium text-foreground mb-2">
        Select a Pipeline
      </h2>
      <p className="text-sm text-muted-foreground">
        Choose a pipeline from the sidebar to view its details and execute it.
      </p>
    </>
  );
}

function NoPipelinesFound() {
  return (
    <>
      <EmptyStateIcon />
      <h2 className="text-lg font-medium text-foreground mb-2">
        No Pipelines Found
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Create a pipeline file to get started.
      </p>
      <code className="inline-block bg-muted px-3 py-1.5 rounded text-sm text-foreground/80">
        *.ucd-pipeline.ts
      </code>
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">Loading pipelines...</p>
    </div>
  );
}

function HomePage() {
  const { data, loading } = usePipelines();

  if (loading) {
    return <LoadingState />;
  }

  const pipelineCount = data?.pipelines?.length ?? 0;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {pipelineCount > 0 ? <SelectPipelinePrompt /> : <NoPipelinesFound />}
      </div>
    </div>
  );
}
