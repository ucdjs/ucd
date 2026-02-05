import type { PipelineInfo, PipelinesResponse } from "../../types";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { cn } from "#lib/utils";
import { memo } from "react";
import { PipelineSidebarErrors } from "./pipeline-sidebar-errors.js";
import { PipelineSidebarHeader } from "./pipeline-sidebar-header.js";
import { PipelineSidebarList } from "./pipeline-sidebar-list.js";

export interface PipelineSidebarProps {
  /**
   * Pipeline data from the API
   */

  data: PipelinesResponse | null;

  /**
   * Whether data is currently loading
   */

  loading: boolean;

  /**
   * Currently selected pipeline ID
   */

  currentPipelineId?: string;

  /**
   * Callback when a pipeline is clicked
   */

  onPipelineClick?: (pipeline: PipelineInfo) => void;

  /**
   * Custom item renderer function
   */

  renderItem?: (pipeline: PipelineInfo, isActive: boolean) => React.ReactNode;

  /**
   * Sidebar title text
   */

  title?: string;

  /**
   * Current search value
   */

  searchValue?: string;

  /**
   * Callback when search value changes
   */

  onSearchChange?: (value: string) => void;

  /**
   * Placeholder text for search input
   */

  searchPlaceholder?: string;

  /**
   * Additional CSS class names to apply
   */

  className?: string;
}

export const PipelineSidebar = memo(({
  data,
  loading,
  currentPipelineId,
  onPipelineClick,
  renderItem,
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  className,
}: PipelineSidebarProps) => {
  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 border-r border-sidebar-border flex flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <PipelineSidebarHeader title={title} cwd={data?.cwd} />

      {onSearchChange && (
        <div className="px-3 py-2">
          <Input
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 text-xs"
          />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-1 px-2">
        {loading
          ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">
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

      <PipelineSidebarErrors count={data?.errors.length ?? 0} />
    </aside>
  );
});

PipelineSidebar.displayName = "PipelineSidebar";
