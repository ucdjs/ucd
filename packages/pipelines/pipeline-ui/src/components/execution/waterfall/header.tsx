import { formatDuration } from "#lib/execution-logs";
import { cn } from "#lib/utils";

export interface ExecutionWaterfallHeaderProps {
  totalSpans: number;
  visibleSpans: number;
  durationMs: number;
  selectedLabel: string | null;
  selectedSpanId: string | null;
  onClear: () => void;
}

export function ExecutionWaterfallHeader({
  totalSpans,
  visibleSpans,
  durationMs,
  selectedLabel,
  selectedSpanId,
  onClear,
}: ExecutionWaterfallHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Execution timeline</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            {visibleSpans}
            {" "}
            of
            {" "}
            {totalSpans}
            {" "}
            spans visible
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            {formatDuration(durationMs)}
            {" "}
            total runtime
          </span>
          {selectedLabel && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-foreground">
                Selected:
                {" "}
                {selectedLabel}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        className={cn(
          "text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          !selectedSpanId && "opacity-50",
        )}
        onClick={onClear}
      >
        Clear log filter
      </button>
    </div>
  );
}
