import type { OverviewActivityDay, OverviewExecutionSummary } from "#shared/schemas/overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { EXECUTION_STATUSES } from "@ucdjs/pipelines-executor";
import { PlayCircle } from "lucide-react";
import { useState } from "react";
import { formatDayLabel, getStateCount, overviewStates } from "./shared";

interface ExecutionActivityChartProps {
  activity: OverviewActivityDay[];
  summaryStates: OverviewExecutionSummary;
  compact?: boolean;
}

export function ExecutionActivityChart({
  activity,
  summaryStates,
  compact = false,
}: ExecutionActivityChartProps) {
  const availableStates = overviewStates.filter((state) => {
    const knownStatus = state.statuses.some((status) => EXECUTION_STATUSES.includes(status));
    const hasActivity = activity.some((day) => getStateCount(day, state) > 0);
    const hasSummary = getStateCount(summaryStates, state) > 0;

    return (knownStatus && hasActivity) || hasSummary;
  });
  const [visibleStateKeys, setVisibleStateKeys] = useState<Set<string>>(
    () => new Set(availableStates.map((state) => state.key)),
  );

  const filteredStates = availableStates.filter((state) => visibleStateKeys.has(state.key));
  const visibleStates = filteredStates.length > 0 ? filteredStates : availableStates;

  const activityWithTotals = activity.map((day) => ({
    ...day,
    total: visibleStates.reduce((sum, state) => sum + getStateCount(day, state), 0),
  }));

  const maxTotal = Math.max(1, ...activityWithTotals.map((day) => day.total));
  const hasActivity = activityWithTotals.some((day) => day.total > 0);

  function toggleState(key: string) {
    setVisibleStateKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        if (next.size === 1) return current;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <Card className={compact ? "" : "xl:col-span-8"}>
      <CardHeader className={compact ? "border-b border-border/60 pb-2 pt-3 px-4" : "border-b border-border/60 pb-3"}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Execution activity</CardTitle>
            {!compact && <CardDescription>Global execution states over the last seven days.</CardDescription>}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableStates.map((state) => {
              const isActive = visibleStates.some((item) => item.key === state.key);
              const total = getStateCount(summaryStates, state);

              return (
                <button
                  key={state.key}
                  type="button"
                  onClick={() => toggleState(state.key)}
                  aria-pressed={isActive}
                  aria-label={`${isActive ? "Hide" : "Show"} ${state.label} executions`}
                  className={isActive
                    ? "inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors"
                    : "inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/55 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/75 hover:text-foreground"}
                >
                  <span className={`h-2 w-2 rounded-full ${state.markerClassName}`} />
                  <span>{state.label}</span>
                  <span className="text-muted-foreground">{total}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-3 px-4 pb-3" : "pt-4"}>
        {!hasActivity
          ? (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center">
                <PlayCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">No execution activity yet</p>
              </div>
            )
          : (
              <div className="grid grid-cols-7 gap-3">
                {activityWithTotals.map((day) => (
                  <div key={day.date} className="grid gap-2">
                    <div className="text-center text-xs font-medium tabular-nums text-muted-foreground">
                      {day.total}
                    </div>
                    <div className={`flex ${compact ? "h-24" : "h-36"} items-end justify-center p-1`}>
                      <div
                        role="img"
                        aria-label={`${formatDayLabel(day.date)}: ${day.total} visible executions`}
                        className="flex h-full w-full max-w-14 flex-col justify-end overflow-hidden rounded-t-md border border-border/60 bg-muted/45"
                        title={`${day.total} visible executions`}
                      >
                        {visibleStates.map((state) => {
                          const value = getStateCount(day, state);
                          if (value <= 0) return null;

                          return (
                            <div
                              key={`${day.date}-${state.key}`}
                              className={`${state.segmentClassName} transition-opacity hover:opacity-90`}
                              style={{ height: `${(value / maxTotal) * 100}%` }}
                              title={`${state.label}: ${value}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDayLabel(day.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}
