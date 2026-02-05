import type { PipelineInfo, PipelinesResponse } from "../../types";
import { cn } from "#lib/utils";
import { SiGithub, SiGitlab } from "@icons-pack/react-simple-icons";
import { Folder } from "lucide-react";
import { memo } from "react";

export interface PipelineSidebarItemProps {
  /**
   * Pipeline data to display in the sidebar item
   */

  pipeline: PipelineInfo;

  /**
   * Whether this item is currently selected/active
   */

  isActive: boolean;

  /**
   * Callback when the item is clicked
   */

  onClick?: () => void;

  /**
   * Additional CSS class names to apply
   */

  className?: string;
}

function getSourceStyles(sourceId: string): { bg: string; icon: typeof SiGithub } {
  if (sourceId.startsWith("github-")) {
    return {
      bg: "bg-blue-500/15 text-blue-500",
      icon: SiGithub,
    };
  }
  if (sourceId.startsWith("gitlab-")) {
    return {
      bg: "bg-orange-500/15 text-orange-500",
      icon: SiGitlab,
    };
  }
  return {
    bg: "bg-emerald-500/15 text-emerald-500",
    icon: Folder,
  };
}

export const PipelineSidebarItem = memo(({
  pipeline,
  isActive,
  onClick,
  className,
}: PipelineSidebarItemProps) => {
  const sourceStyles = getSourceStyles(pipeline.sourceId);
  const Icon = sourceStyles.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left block px-3 py-2 text-xs transition-colors rounded-md",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center",
            sourceStyles.bg,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block truncate font-medium text-foreground leading-tight">
            {pipeline.name || pipeline.id}
          </span>
          <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">
            {pipeline.routeCount}
            {" "}
            routes ·
            {" "}
            {pipeline.versions.length}
            {" "}
            versions
          </span>
        </div>
      </div>
    </button>
  );
});

PipelineSidebarItem.displayName = "PipelineSidebarItem";
