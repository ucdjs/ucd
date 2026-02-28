import type { PipelinesResponse } from "@ucdjs/pipelines-ui";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { pipelines } = useLoaderData({ from: "__root__" });

  const pipelineCount = (pipelines?.files || []).map((file) => file.pipelines.length).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
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
        <h2 className="text-lg font-medium text-foreground mb-2">
          {pipelineCount > 0 ? "Select a Pipeline" : "No Pipelines Found"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {pipelineCount > 0
            ? "Choose a pipeline from the sidebar to view its details and execute it."
            : "Create a pipeline file to get started."}
        </p>
      </div>
    </div>
  );
}
