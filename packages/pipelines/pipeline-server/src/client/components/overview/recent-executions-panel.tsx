import type { ExecutionSummaryItem } from "#functions";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { StatusIcon } from "#components";
import { formatExecutionDuration, formatStartedAt } from "#lib";

interface RecentExecutionsPanelProps {
  executions: ExecutionSummaryItem[];
}

export function RecentExecutionsPanel({
  executions,
}: RecentExecutionsPanelProps) {
  return (
    <Card className="xl:col-span-8">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="text-base">Recent executions</CardTitle>
        <CardDescription>Latest activity across the workspace.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {executions.length === 0
          ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No executions recorded yet.
              </div>
            )
          : (
              <div className="divide-y divide-border/60">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="grid gap-2 px-1 py-3 md:grid-cols-[minmax(0,1.6fr)_110px_80px_auto] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={execution.status} />
                        <code className="truncate text-xs font-medium">{execution.id}</code>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatStartedAt(execution.startedAt)}</span>
                        {execution.versions && execution.versions.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="truncate">{execution.versions.join(", ")}</span>
                          </>
                        )}
                      </div>
                      {execution.error && (
                        <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400">{execution.error}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground md:text-right">
                      {formatExecutionDuration(execution.startedAt, execution.completedAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {execution.hasGraph ? "Graph" : "No graph"}
                    </div>
                    <div className="md:justify-self-end">
                      <Badge variant="secondary" className="capitalize">
                        {execution.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}
