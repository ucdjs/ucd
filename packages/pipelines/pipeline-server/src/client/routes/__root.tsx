import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import type { PipelinesContextValue } from "../types";
import {
  createRootRoute,
  Link,
  Outlet,
  useMatches,
  useNavigate,
} from "@tanstack/react-router";
import {
  PipelineSidebar,
  PipelineSidebarItem,
  useExecute,
  usePipelines,
} from "@ucdjs/pipelines-ui";
import { useCallback, useMemo, useState } from "react";
import { PipelineCommandPalette } from "../components/PipelineCommandPalette";
import { PipelineSidebarContextMenu } from "../components/PipelineSidebarContextMenu";
import { PipelinesContext } from "../hooks/pipeline-context";
import { useCommandPalette } from "../hooks/use-command-palette";

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
  onExecute: (versions: string[]) => void;
}

function SidebarItemWithContext({ pipeline, isActive, onExecute }: SidebarItemProps) {
  const navigate = useNavigate();

  const handleNavigate = useCallback((to: string) => {
    navigate({ to });
  }, [navigate]);

  const handleExecute = useCallback((versions: string[]) => {
    onExecute(versions);
    // Navigate to the pipeline logs after execution
    navigate({ to: "/pipelines/$id", params: { id: pipeline.id } });
  }, [onExecute, navigate, pipeline.id]);

  const handleClick = useCallback(() => {
    navigate({ to: "/pipelines/$id", params: { id: pipeline.id } });
  }, [navigate, pipeline.id]);

  return (
    <PipelineSidebarContextMenu
      pipeline={pipeline}
      onExecute={handleExecute}
      onNavigate={handleNavigate}
    >
      <div 
        className="block cursor-pointer" 
        onClick={handleClick}
        aria-label={`Open pipeline: ${pipeline.name || pipeline.id}`}
      >
        <PipelineSidebarItem
          pipeline={pipeline}
          isActive={isActive}
        />
      </div>
    </PipelineSidebarContextMenu>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [searchValue, setSearchValue] = useState("");
  const { data, loading, error, refetch } = usePipelines({ search: searchValue });
  const currentPipelineId = useCurrentPipelineId();
  const { execute } = useExecute();
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();
  const navigate = useNavigate();

  const contextValue = useMemo<PipelinesContextValue>(
    () => ({
      data,
      loading,
      error,
      refetch,
    }),
    [data, loading, error, refetch],
  );

  const handleExecute = useCallback(async (pipelineId: string, versions: string[]) => {
    try {
      await execute(pipelineId, versions);
      // Navigate to the pipeline
      navigate({ to: "/pipelines/$id", params: { id: pipelineId } });
    } catch (err) {
      console.error("Execution failed:", err);
    }
  }, [execute, navigate]);

  const handleNavigate = useCallback((to: string) => {
    navigate({ to });
  }, [navigate]);

  const pipelines = data?.pipelines ?? [];

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
            <SidebarItemWithContext
              pipeline={pipeline}
              isActive={isActive}
              onExecute={(versions) => handleExecute(pipeline.id, versions)}
            />
          )}
        />
        <main className="flex-1 overflow-hidden flex flex-col" role="main">
          <Outlet />
        </main>
      </div>

      <PipelineCommandPalette
        pipelines={pipelines}
        currentPipelineId={currentPipelineId}
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onExecute={handleExecute}
        onNavigate={handleNavigate}
      />
    </PipelinesContext>
  );
}
