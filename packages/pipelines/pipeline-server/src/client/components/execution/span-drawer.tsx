import type { ExecutionSpan } from "../../lib/execution-utils";
import { formatDuration } from "#lib/format";
import { cn } from "@ucdjs-internal/shared-ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ucdjs-internal/shared-ui/ui/sheet";

export interface ExecutionSpanDrawerProps {
  span: ExecutionSpan | null;
  baseTime: number;
  onClose: () => void;
}

export function ExecutionSpanDrawer({ span, baseTime, onClose }: ExecutionSpanDrawerProps) {
  const open = Boolean(span);
  const offsetStart = span ? Math.max(0, span.start - baseTime) : 0;
  const offsetEnd = span ? Math.max(0, span.end - baseTime) : 0;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent side="right" className="w-95">
        <SheetHeader>
          <SheetTitle>Span Details</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4 space-y-4">
          <div className="execution-phase flex items-center gap-2" data-phase={span?.phase} data-error={span?.isError ? true : undefined}>
            <span className={cn("h-2 w-2 rounded-full", span ? "execution-phase-dot" : "bg-muted")} />
            <span className="text-sm font-medium truncate">
              {span?.label ?? "No span selected"}
            </span>
          </div>

          <div className="grid gap-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Phase</span>
              <span className="text-foreground">{span?.phase ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Duration</span>
              <span className="text-foreground">
                {span ? formatDuration(span.durationMs) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Start offset</span>
              <span className="text-foreground">
                {span ? formatDuration(offsetStart) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>End offset</span>
              <span className="text-foreground">
                {span ? formatDuration(offsetEnd) : "-"}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
