import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type { ExecuteResult, PipelineDetails } from "@ucdjs/pipelines-ui";
import type { PipelineDetailContextValue, PipelineExecutionState, PipelineTab } from "../types";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import {
  useExecute,
  usePipeline,
  VersionSelector,
} from "@ucdjs/pipelines-ui";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PipelineDetailContext } from "../hooks/pipeline-detail-context";

const PIPELINE_TABS: readonly PipelineTab[] = [
  { id: "overview", label: "Overview", to: "/pipelines/$id", exact: true },
  { id: "graph", label: "Graph", to: "/pipelines/$id/graph" },
  { id: "inspect", label: "Inspect", to: "/pipelines/$id/inspect" },
  { id: "logs", label: "Logs", to: "/pipelines/$id/logs" },
  { id: "code", label: "Code", to: "/pipelines/$id/code" },
] as const;

function useActiveTabId(): string {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return useMemo(() => {
    const matchingTab = [...PIPELINE_TABS]
      .reverse()
      .find((tab) => {
        const pattern = tab.to.replace("$id", "[^/]+");
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(currentPath);
      });

    return matchingTab?.id ?? PIPELINE_TABS[0]!.id;
  }, [currentPath]);
}

interface PipelineHeaderProps {
  pipeline: PipelineDetails;
  selectedVersions: Set<string>;
  executing: boolean;
  onExecute: () => void;
}

function PipelineHeaderSkeleton() {
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="min-w-60 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

function PipelineHeader({
  pipeline,
  selectedVersions,
  executing,
  onExecute,
}: PipelineHeaderProps) {
  return (
    <header className="border-b border-border px-6 py-4 bg-card/50">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="min-w-60 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              {pipeline.name || pipeline.id}
            </h1>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline.versions.length}
              {" "}
              versions
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline.routeCount}
              {" "}
              routes
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline.sourceCount}
              {" "}
              sources
            </Badge>
          </div>
          {pipeline.description && (
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {pipeline.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={onExecute}
            disabled={selectedVersions.size === 0 || executing}
            className="text-xs"
            aria-label={executing ? "Pipeline is running" : "Execute pipeline"}
          >
            {executing ? "Running..." : "Execute"}
          </Button>
        </div>
      </div>
    </header>
  );
}

interface VersionSelectorSectionProps {
  pipeline: PipelineDetails;
  selectedVersions: Set<string>;
  onToggleVersion: (version: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function VersionSelectorSection({
  pipeline,
  selectedVersions,
  onToggleVersion,
  onSelectAll,
  onDeselectAll,
}: VersionSelectorSectionProps) {
  return (
    <div className="px-6 py-3 border-b border-border bg-muted/30">
      <VersionSelector
        versions={pipeline.versions}
        selectedVersions={selectedVersions}
        onToggleVersion={onToggleVersion}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />
    </div>
  );
}

interface PipelineTabsProps {
  pipelineId: string;
  activeTabId: string;
}

function PipelineTabs({ pipelineId, activeTabId }: PipelineTabsProps) {
  return (
    <nav 
      className="px-6 pt-4 flex flex-wrap gap-1 border-b border-border" 
      role="tablist" 
      aria-label="Pipeline sections"
    >
      {PIPELINE_TABS.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <Link
            key={tab.id}
            to={tab.to}
            params={{ id: pipelineId }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            className={cn(
              "px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  context?: string;
}

function ErrorState({ error, context }: ErrorStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center" role="alert">
      <div className="text-center max-w-md mx-auto p-6">
        <p className="text-sm text-destructive mb-2">{error}</p>
        {context && (
          <p className="text-xs text-muted-foreground">{context}</p>
        )}
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

export const Route = createFileRoute("/pipelines/$id")({
  component: PipelineDetailLayout,
});

function PipelineDetailLayout() {
  const { id } = Route.useParams();
  const { pipeline, loading, error } = usePipeline(id);
  const { execute, executing, result, error: executeError, reset } = useExecute();
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(() => new Set());
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const activeTabId = useActiveTabId();

  useEffect(() => {
    if (pipeline) {
      setSelectedVersions(new Set(pipeline.versions));
      setEvents([]);
      reset();
    }
  }, [pipeline?.id, reset]);

  const toggleVersion = useCallback((version: string) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }, []);

  const selectAllVersions = useCallback(() => {
    if (pipeline) {
      setSelectedVersions(new Set(pipeline.versions));
    }
  }, [pipeline?.versions]);

  const deselectAllVersions = useCallback(() => {
    setSelectedVersions(new Set());
  }, []);

  const executePipeline = useCallback(async () => {
    if (!pipeline || selectedVersions.size === 0) return;

    try {
      const execResult = await execute(id, Array.from(selectedVersions));
      setEvents(execResult.events ?? []);
    } catch (err) {
      console.error("Pipeline execution failed:", err);
    }
  }, [execute, id, pipeline, selectedVersions]);

  const executionState = useMemo<PipelineExecutionState>(() => ({
    result: result ?? null,
    events,
    executing,
    error: executeError,
  }), [events, executeError, executing, result]);

  const contextValue = useMemo<PipelineDetailContextValue>(() => ({
    pipeline,
    loading,
    error,
    execution: executionState,
    selectedVersions,
    setSelectedVersions,
    toggleVersion,
    selectAllVersions,
    deselectAllVersions,
    executePipeline,
  }), [pipeline, loading, error, executionState, selectedVersions, toggleVersion, selectAllVersions, deselectAllVersions, executePipeline]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <PipelineHeaderSkeleton />
        <PipelineContentSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} context={`Pipeline ID: ${id}`} />;
  }

  if (!pipeline) {
    return <ErrorState error="Pipeline not found" />;
  }

  return (
    <PipelineDetailContext value={contextValue}>
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="px-6">
          <PipelineHeader
            pipeline={pipeline}
            selectedVersions={selectedVersions}
            executing={executing}
            onExecute={executePipeline}
          />

          <VersionSelectorSection
            pipeline={pipeline}
            selectedVersions={selectedVersions}
            onToggleVersion={toggleVersion}
            onSelectAll={selectAllVersions}
            onDeselectAll={deselectAllVersions}
          />

          <PipelineTabs pipelineId={id} activeTabId={activeTabId} />
        </div>

        <main className="flex-1 overflow-y-auto p-6 pt-4">
          <Suspense fallback={<PipelineContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </PipelineDetailContext>
  );
}
