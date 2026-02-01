import type { PipelineInfo, PipelinesResponse } from "../types";
import { cn } from "#lib/utils";
import { memo } from "react";

export interface PipelineSidebarItemProps {
  pipeline: PipelineInfo;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Individual pipeline item in the sidebar
 */
export const PipelineSidebarItem = memo(({
  pipeline,
  isActive,
  onClick,
  className,
}: PipelineSidebarItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left block px-4 py-2 text-sm transition-colors",
        isActive
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
        className,
      )}
    >
      <span className="block truncate font-medium">
        {pipeline.name || pipeline.id}
      </span>
      <span className="block text-xs text-zinc-500 mt-0.5">
        {pipeline.routeCount}
        {" "}
        routes ·
        {" "}
        {pipeline.versions.length}
        {" "}
        versions
      </span>
    </button>
  );
});

export interface PipelineSidebarListProps {
  pipelines: PipelineInfo[];
  currentPipelineId?: string;
  onPipelineClick?: (pipeline: PipelineInfo) => void;
  renderItem?: (pipeline: PipelineInfo, isActive: boolean) => React.ReactNode;
  className?: string;
}

/**
 * List of pipelines in the sidebar
 */
export const PipelineSidebarList = memo(({
  pipelines,
  currentPipelineId,
  onPipelineClick,
  renderItem,
  className,
}: PipelineSidebarListProps) => {
  if (pipelines.length === 0) {
    return (
      <div className={cn("px-4 py-8 text-center", className)}>
        <p className="text-sm text-zinc-500">No pipelines found</p>
        <p className="text-xs text-zinc-600 mt-1">
          Create a
          {" "}
          <code className="text-zinc-400">*.ucd-pipeline.ts</code>
          {" "}
          file
        </p>
      </div>
    );
  }

  return (
    <ul className={cn("space-y-0.5", className)}>
      {pipelines.map((pipeline) => {
        const isActive = currentPipelineId === pipeline.id;
        return (
          <li key={pipeline.id}>
            {renderItem
              ? (
                  renderItem(pipeline, isActive)
                )
              : (
                  <PipelineSidebarItem
                    pipeline={pipeline}
                    isActive={isActive}
                    onClick={() => onPipelineClick?.(pipeline)}
                  />
                )}
          </li>
        );
      })}
    </ul>
  );
});

export interface PipelineSidebarErrorsProps {
  count: number;
  className?: string;
}

/**
 * Error indicator shown at the bottom of the sidebar
 */
export const PipelineSidebarErrors = memo(({
  count,
  className,
}: PipelineSidebarErrorsProps) => {
  if (count === 0) return null;

  return (
    <div className={cn("border-t border-zinc-800 px-4 py-2", className)}>
      <p className="text-xs text-red-400">
        {count}
        {" "}
        load error
        {count !== 1 ? "s" : ""}
      </p>
    </div>
  );
});

export interface PipelineSidebarHeaderProps {
  title?: string;
  cwd?: string;
  className?: string;
}

/**
 * Header section of the sidebar
 */
export const PipelineSidebarHeader = memo(({
  title = "UCD Pipelines",
  cwd,
  className,
}: PipelineSidebarHeaderProps) => {
  return (
    <div className={cn("px-4 py-3 border-b border-zinc-800", className)}>
      <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
      {cwd && (
        <p
          className="text-xs text-zinc-500 mt-0.5 truncate"
          title={cwd}
        >
          {cwd}
        </p>
      )}
    </div>
  );
});

export interface PipelineSidebarProps {
  /** Pipeline data from the API */
  data: PipelinesResponse | null;
  /** Whether data is currently loading */
  loading: boolean;
  /** Currently selected pipeline ID */
  currentPipelineId?: string;
  /** Callback when a pipeline is clicked */
  onPipelineClick?: (pipeline: PipelineInfo) => void;
  /** Custom item renderer */
  renderItem?: (pipeline: PipelineInfo, isActive: boolean) => React.ReactNode;
  /** Sidebar title */
  title?: string;
  /** Additional className for the container */
  className?: string;
}

/**
 * Complete pipeline sidebar component
 */
export const PipelineSidebar = memo(({
  data,
  loading,
  currentPipelineId,
  onPipelineClick,
  renderItem,
  title,
  className,
}: PipelineSidebarProps) => {
  return (
    <aside className={cn(
      "w-64 flex-shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950",
      className,
    )}
    >
      {/* Header */}
      <PipelineSidebarHeader title={title} cwd={data?.cwd} />

      {/* Pipeline List */}
      <nav className="flex-1 overflow-y-auto py-2">
        {loading
          ? (
              <div className="px-4 py-2 text-sm text-zinc-500">Loading...</div>
            )
          : (
              <PipelineSidebarList
                pipelines={data?.pipelines ?? []}
                currentPipelineId={currentPipelineId}
                onPipelineClick={onPipelineClick}
                renderItem={renderItem}
              />
            )}
      </nav>

      {/* Errors */}
      <PipelineSidebarErrors count={data?.errors.length ?? 0} />
    </aside>
  );
});
