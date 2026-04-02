import type { OverviewExecutionSummary } from "#shared/schemas/overview";
import { cn } from "@ucdjs-internal/shared-ui";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/components";
import { getStateCount, overviewStates } from "./shared";

interface StatusOverviewProps {
  summaryStates: OverviewExecutionSummary;
  total: number;
}

export function StatusOverview({
  summaryStates,
  total,
}: StatusOverviewProps) {
  const items = overviewStates.filter((state) => {
    return getStateCount(summaryStates, state) > 0
      || state.key === "completed"
      || state.key === "failed";
  });

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2 border-r border-border/60 pr-4">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</div>
          <div className="text-lg font-semibold tabular-nums">{total}</div>
        </div>
        {items.map((state) => {
          const Icon = state.icon;
          return (
            <div key={state.key} className="flex items-center gap-1.5" aria-label={`${state.label}: ${getStateCount(summaryStates, state)}`}>
              <span className={cn("h-2 w-2 rounded-full", state.markerClassName)} aria-hidden="true" />
              <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium tabular-nums">{getStateCount(summaryStates, state)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
