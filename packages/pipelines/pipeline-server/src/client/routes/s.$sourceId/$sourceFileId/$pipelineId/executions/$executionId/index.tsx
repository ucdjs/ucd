import type { ExecutionSpan } from "#lib/execution-utils";
import { ExecutionLogsViewer } from "#components/execution/logs/execution-logs-viewer";
import { LogsErrorBoundary } from "#components/execution/logs/logs-error-boundary";
import { ExecutionSpanDrawer } from "#components/execution/span-drawer";
import { StatusBadge } from "#components/execution/status-badge";
import { StatusIcon } from "#components/execution/status-icon";
import { ExecutionWaterfall } from "#components/execution/waterfall";
import { buildExecutionSpans } from "#lib/execution-utils";
import { formatExecutionDuration } from "#lib/format";
import { executionTracesQueryOptions } from "#queries/execution";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { ArrowLeft, Filter, GitBranch } from "lucide-react";
import { Suspense, useMemo, useState } from "react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(executionTracesQueryOptions({
        sourceId: params.sourceId,
        fileId: params.sourceFileId,
        pipelineId: params.pipelineId,
        executionId: params.executionId,
        limit: 500,
      }));
    } catch (error) {
      if (isNotFoundError(error)) {
        throw notFound();
      }

      throw error;
    }
  },
  component: ExecutionDetailPage,
});

function ExecutionDetailPage() {
  const { sourceId, sourceFileId, pipelineId, executionId } = Route.useParams();
  const { data: executionData } = useSuspenseQuery(executionTracesQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    executionId,
    limit: 500,
  }));

  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeSpan, setActiveSpan] = useState<ExecutionSpan | null>(null);

  const traces = executionData.traces;
  const spans = useMemo(() => buildExecutionSpans(traces), [traces]);

  function handleSpanSelect(spanId: string | null) {
    setSelectedSpanId(spanId);
  }

  function handleSpanClick(span: ExecutionSpan) {
    setActiveSpan(span);
  }

  return (
    <div className="flex min-h-0 flex-col">
      <header className="shrink-0 border-b bg-background px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
              params={{ sourceId, sourceFileId, pipelineId }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <StatusIcon status={executionData.status} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">
                  Execution
                  {" "}
                  {executionId.slice(0, 8)}
                </h1>
                <StatusBadge status={executionData.status} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {executionData.pagination.total}
                {" "}
                traces
                {" · "}
                {selectedSpanId
                  ? "Filtered"
                  : executionData.traces.length > 0
                    ? formatExecutionDuration(
                        executionData.traces[0]!.timestamp,
                        executionData.traces.at(-1)?.timestamp ?? null,
                      )
                    : "No traces"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSpanId && (
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                Span filter
              </div>
            )}

            <Button
              nativeButton={false}
              variant="outline"
              render={(props) => {
                return (
                  <Link
                    to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph"
                    params={{ sourceId, sourceFileId, pipelineId, executionId }}
                    {...props}
                  >
                  </Link>
                );
              }}
            >
              <GitBranch className="h-4 w-4" />
              Graph
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-sm font-semibold">Timeline</h2>
            {selectedSpanId && (
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                Span filter
              </div>
            )}
          </div>

          <ExecutionWaterfall
            spans={spans}
            selectedSpanId={selectedSpanId}
            onSelect={handleSpanSelect}
            onSpanClick={handleSpanClick}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Logs</h2>
          <LogsErrorBoundary>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading logs…</div>}>
              <ExecutionLogsViewer
                sourceId={sourceId}
                sourceFileId={sourceFileId}
                pipelineId={pipelineId}
                executionId={executionId}
                selectedSpanId={selectedSpanId}
              />
            </Suspense>
          </LogsErrorBoundary>
        </section>
      </div>

      <ExecutionSpanDrawer
        span={activeSpan}
        baseTime={traces.length > 0 ? new Date(traces[0]!.timestamp).getTime() : 0}
        onClose={() => setActiveSpan(null)}
      />
    </div>
  );
}
