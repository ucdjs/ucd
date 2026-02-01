import type { PipelineInfo, PipelinesResponse } from "@ucdjs/pipelines-ui";
import {
  createRootRoute,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import {
  PipelineSidebar,
  PipelineSidebarItem,
  usePipelines,
} from "@ucdjs/pipelines-ui";
import { createContext, use, useMemo } from "react";

interface PipelinesContextValue {
  data: PipelinesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const PipelinesContext = createContext<PipelinesContextValue | null>(null);

export function usePipelinesContext(): PipelinesContextValue {
  const ctx = use(PipelinesContext);
  if (!ctx) {
    throw new Error("usePipelinesContext must be used within PipelinesProvider");
  }
  return ctx;
}

function useCurrentPipelineId(): string | undefined {
  const matches = useMatches();
  return useMemo(() => {
    for (const match of matches) {
      const params = match.params as Record<string, string> | undefined;
      if (params && "id" in params) {
        return params.id;
      }
    }
    return undefined;
  }, [matches]);
}

function SidebarItemWithLink({
  pipeline,
  isActive,
}: {
  pipeline: PipelineInfo;
  isActive: boolean;
}) {
  return (
    <Link
      to="/pipelines/$id"
      params={{ id: pipeline.id }}
      className="block"
    >
      <PipelineSidebarItem
        pipeline={pipeline}
        isActive={isActive}
      />
    </Link>
  );
}

function RootLayout() {
  const { data, loading, error, refetch } = usePipelines();
  const currentPipelineId = useCurrentPipelineId();

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PipelinesContextValue>(
    () => ({
      data,
      loading,
      error,
      refetch,
    }),
    [data, loading, error, refetch],
  );

  return (
    <PipelinesContext value={contextValue}>
      <div className="flex h-screen bg-zinc-950 text-zinc-100">
        <PipelineSidebar
          data={data}
          loading={loading}
          currentPipelineId={currentPipelineId}
          renderItem={(pipeline, isActive) => (
            <SidebarItemWithLink pipeline={pipeline} isActive={isActive} />
          )}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </PipelinesContext>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
