import type { OverviewActivityDay } from "#queries/overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { EXECUTION_STATUSES } from "@ucdjs/pipelines-executor";
import { PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDayLabel, getStateCount, overviewStates } from "./shared";

interface ExecutionActivityChartProps {
  activity: OverviewActivityDay[];
  summaryStates: Record<string, number>;
}

export function ExecutionActivityChart({
  activity,
  summaryStates,
}: ExecutionActivityChartProps) {
  const availableStates = overviewStates.filter((state) => {
    const knownStatus = state.statuses.some((status) => EXECUTION_STATUSES.includes(status));
    const hasActivity = activity.some((day) => getStateCount(day.states, state) > 0);
    const hasSummary = getStateCount(summaryStates, state) > 0;

    return (knownStatus && hasActivity) || hasSummary;
  });
  const [visibleStateKeys, setVisibleStateKeys] = useState<Set<string>>(
    () => new Set(availableStates.map((state) => state.key)),
  );

  const visibleStates = useMemo(() => {
    const next = availableStates.filter((state) => visibleStateKeys.has(state.key));
    return next.length > 0 ? next : availableStates;
  }, [availableStates, visibleStateKeys]);

  const activityWithTotals = useMemo(() => {
    return activity.map((day) => ({
      ...day,
      total: visibleStates.reduce((sum, state) => sum + getStateCount(day.states, state), 0),
    }));
  }, [activity, visibleStates]);

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
    <Card className="xl:col-span-8">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Execution activity</CardTitle>
            <CardDescription>Global execution states over the last seven days.</CardDescription>
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
                  className={isActive
                    ? "inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                    : "inline-flex items-center gap-2 rounded-md border border-border/50 bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground"}
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
      <CardContent className="pt-4">
        {!hasActivity
          ? (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center">
                <PlayCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
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
                    <div className="flex h-32 items-end justify-center border border-border/60 bg-muted/10 p-1.5">
                      <div className="flex h-full w-full max-w-16 flex-col justify-end overflow-hidden bg-background">
                        {visibleStates.map((state) => {
                          const value = getStateCount(day.states, state);
                          if (value <= 0) return null;

                          return (
                            <div
                              key={`${day.date}-${state.key}`}
                              className={state.segmentClassName}
                              style={{ height: `${(value / maxTotal) * 100}%` }}
                              title={`${state.label}: ${value}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
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
