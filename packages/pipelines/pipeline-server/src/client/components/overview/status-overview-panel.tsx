import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { getStateCount, overviewStates } from "./shared";

interface StatusOverviewPanelProps {
  summaryStates: Record<string, number>;
  total: number;
}

export function StatusOverviewPanel({
  summaryStates,
  total,
}: StatusOverviewPanelProps) {
  const items = overviewStates.filter((state) => {
    return getStateCount(summaryStates, state) > 0
      || state.key === "completed"
      || state.key === "failed";
  });

  return (
    <Card className="xl:col-span-4">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="text-base">Status overview</CardTitle>
        <CardDescription>Current execution totals across all tracked states.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4 sm:grid-cols-2 xl:grid-cols-2">
        <div className="grid gap-1 border border-border/60 bg-muted/10 p-3 sm:col-span-2">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Executions</div>
          <div className="text-2xl font-semibold tabular-nums">{total}</div>
        </div>
        {items.map((state) => {
          const Icon = state.icon;

          return (
            <div key={state.key} className="grid gap-1 border border-border/60 bg-muted/10 p-3">
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
