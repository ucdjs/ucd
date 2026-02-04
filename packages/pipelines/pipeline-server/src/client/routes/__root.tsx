import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import type { PipelinesContextValue } from "../types";
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
import { useMemo, useState } from "react";
import { PipelinesContext } from "../hooks/pipeline-context";

function useCurrentPipelineId(): string | undefined {
  const matches = useMatches();
  return useMemo(() => {
    for (const match of matches) {
      const params = match.params as Record<string, string> | undefined;
      if (params?.id) {
        return params.id;
      }
    }
    return undefined;
  }, [matches]);
}

interface SidebarItemProps {
  pipeline: PipelineInfo;
  isActive: boolean;
}

function SidebarItemWithLink({ pipeline, isActive }: SidebarItemProps) {
  return (
    <Link
      to="/pipelines/$id"
      params={{ id: pipeline.id }}
      className="block"
      aria-label={`Open pipeline: ${pipeline.name || pipeline.id}`}
    >
      <PipelineSidebarItem
        pipeline={pipeline}
        isActive={isActive}
      />
    </Link>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [searchValue, setSearchValue] = useState("");
  const { data, loading, error, refetch } = usePipelines({ search: searchValue });
  const currentPipelineId = useCurrentPipelineId();

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
      <div className="dark flex h-screen bg-background text-foreground">
        <PipelineSidebar
          data={data}
          loading={loading}
          currentPipelineId={currentPipelineId}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          renderItem={(pipeline, isActive) => (
            <SidebarItemWithLink pipeline={pipeline} isActive={isActive} />
          )}
        />
        <main className="flex-1 overflow-hidden flex flex-col" role="main">
          <Outlet />
        </main>
      </div>
    </PipelinesContext>
  );
}
