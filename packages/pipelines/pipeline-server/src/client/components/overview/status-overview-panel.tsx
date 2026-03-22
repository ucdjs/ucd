import type { OverviewExecutionSummary } from "#shared/schemas/overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { getStateCount, overviewStates } from "./shared";

interface StatusOverviewPanelProps {
  summaryStates: OverviewExecutionSummary;
  total: number;
  compact?: boolean;
}

export function StatusOverviewPanel({
  summaryStates,
  total,
  compact = false,
}: StatusOverviewPanelProps) {
  const items = overviewStates.filter((state) => {
    return getStateCount(summaryStates, state) > 0
      || state.key === "completed"
      || state.key === "failed";
  });

  if (compact) {
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
              <div key={state.key} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${state.markerClassName}`} />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium tabular-nums">{getStateCount(summaryStates, state)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="xl:col-span-4">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="text-base">Status overview</CardTitle>
        <CardDescription>Current execution totals across all tracked states.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4 sm:grid-cols-2 xl:grid-cols-2">
        <div className="grid gap-1 border border-border/60 bg-muted/30 p-3 sm:col-span-2">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Executions</div>
          <div className="text-2xl font-semibold tabular-nums">{total}</div>
        </div>
        {items.map((state) => {
          const Icon = state.icon;

          return (
            <div key={state.key} className="grid gap-1 border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${state.markerClassName}`} />
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{state.label}</div>
              </div>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-xl font-semibold tabular-nums">
                  {getStateCount(summaryStates, state)}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
