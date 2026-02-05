import type { PipelineInfo } from "../../types";
import { cn } from "#lib/utils";
import { memo } from "react";
import { PipelineSidebarItem } from "./pipeline-sidebar-item";

export interface PipelineSidebarListProps {
  /**
   * Array of pipelines to display in the list
   */

  pipelines: PipelineInfo[];

  /**
   * ID of the currently selected pipeline
   */

  currentPipelineId?: string;

  /**
   * Callback when a pipeline item is clicked
   */

  onPipelineClick?: (pipeline: PipelineInfo) => void;

  /**
   * Custom render function for pipeline items
   */

  renderItem?: (pipeline: PipelineInfo, isActive: boolean) => React.ReactNode;

  /**
   * Additional CSS class names to apply
   */

  className?: string;
}

export const PipelineSidebarList = memo(({
  pipelines,
  currentPipelineId,
  onPipelineClick,
  renderItem,
  className,
}: PipelineSidebarListProps) => {
  if (pipelines.length === 0) {
    return (
      <div className={cn("px-3 py-6 text-center", className)}>
        <p className="text-xs text-muted-foreground">No pipelines found</p>
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
              ? renderItem(pipeline, isActive)
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

PipelineSidebarList.displayName = "PipelineSidebarList";
