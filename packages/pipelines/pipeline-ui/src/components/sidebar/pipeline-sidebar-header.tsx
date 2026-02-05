import { cn } from "#lib/utils";
import { memo } from "react";

export interface PipelineSidebarHeaderProps {
  /**
   * Title text to display in the header
   */

  title?: string;

  /**
   * Current working directory path
   */

  cwd?: string;

  /**
   * Additional CSS class names to apply
   */

  className?: string;
}

export const PipelineSidebarHeader = memo(({
  title = "UCD Pipelines",
  cwd,
  className,
}: PipelineSidebarHeaderProps) => {
  return (
    <div className={cn("px-3 py-3 border-b border-border", className)}>
      <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">{title}</h1>
      {cwd && (
        <p
          className="text-[10px] text-muted-foreground mt-1 truncate"
          title={cwd}
        >
          {cwd}
        </p>
      )}
    </div>
  );
});

PipelineSidebarHeader.displayName = "PipelineSidebarHeader";
