import { cn } from "#lib/utils";
import { memo } from "react";

export interface PipelineSidebarErrorsProps {
  /**
   * Number of errors to display
   */

  count: number;

  /**
   * Additional CSS class names to apply
   */

  className?: string;
}

export const PipelineSidebarErrors = memo(({
  count,
  className,
}: PipelineSidebarErrorsProps) => {
  if (count === 0) return null;

  return (
    <div className={cn("border-t border-border px-3 py-2", className)}>
      <p className="text-[10px] text-destructive">
        {count}
        {" "}
        error
        {count !== 1 ? "s" : ""}
      </p>
    </div>
  );
});

PipelineSidebarErrors.displayName = "PipelineSidebarErrors";
