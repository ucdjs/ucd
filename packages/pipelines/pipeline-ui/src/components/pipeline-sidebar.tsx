import type { PipelineInfo, PipelinesResponse } from "../types";
import { cn } from "#lib/utils";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
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
        "w-full text-left block px-3.5 py-2 text-sm transition-colors rounded-md",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
        className,
      )}
    >
      <span className="block truncate font-medium">
        {pipeline.name || pipeline.id}
      </span>
      <span className="block text-xs text-muted-foreground mt-0.5">
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
        <p className="text-sm text-muted-foreground">No pipelines found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a
          {" "}
          <code className="text-foreground/70">*.ucd-pipeline.ts</code>
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
    <div className={cn("border-t border-border px-4 py-2", className)}>
      <p className="text-xs text-destructive">
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
    <div className={cn("px-4 py-3 border-b border-border", className)}>
      <h1 className="text-sm font-semibold text-sidebar-foreground">{title}</h1>
      {cwd && (
        <p
          className="text-xs text-muted-foreground mt-0.5 truncate"
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
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
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
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search pipelines",
  className,
}: PipelineSidebarProps) => {
  return (
    <aside
      className={cn(
        "w-56 flex-shrink-0 border-r border-sidebar-border flex flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      {/* Header */}
      <PipelineSidebarHeader title={title} cwd={data?.cwd} />

      {/* Search */}
      {onSearchChange && (
        <div className="px-4 py-2">
          <Input
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8"
          />
        </div>
      )}

      {/* Pipeline List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {loading
          ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
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
