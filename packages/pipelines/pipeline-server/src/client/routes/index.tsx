import { createFileRoute } from "@tanstack/react-router";
import { memo } from "react";
import { usePipelinesContext } from "./__root";

const HomePage = memo(() => {
  const { data, loading } = usePipelinesContext();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading pipelines...</p>
      </div>
    );
  }

  const pipelineCount = data?.pipelines.length ?? 0;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </div>

        {pipelineCount > 0
          ? (
              <>
                <h2 className="text-lg font-medium text-zinc-100 mb-2">
                  Select a Pipeline
                </h2>
                <p className="text-sm text-zinc-500">
                  Choose a pipeline from the sidebar to view its details and execute it.
                </p>
              </>
            )
          : (
              <>
                <h2 className="text-lg font-medium text-zinc-100 mb-2">
                  No Pipelines Found
                </h2>
                <p className="text-sm text-zinc-500 mb-4">
                  Create a pipeline file to get started.
                </p>
                <code className="inline-block bg-zinc-800 px-3 py-1.5 rounded text-sm text-zinc-300">
                  *.ucd-pipeline.ts
                </code>
              </>
            )}
      </div>
    </div>
  );
});

export const Route = createFileRoute("/")({
  component: HomePage,
});
