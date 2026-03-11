import {
  StatusBadge,
  StatusIcon,
} from "#components/execution/execution-status";
import { ExecutionLogTable } from "#components/execution/log-table";
import { ExecutionSpanDrawer } from "#components/execution/span-drawer";
import { ExecutionWaterfall } from "#components/execution/waterfall";
import { formatBytes } from "#lib/format";
import { executionEventsQueryOptions, executionLogsQueryOptions } from "#queries/execution";
import { isNotFoundError } from "#queries/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ScrollArea } from "@ucdjs-internal/shared-ui/ui/scroll-area";
import { ArrowLeft, Filter, GitBranch } from "lucide-react";
import { useMemo, useState } from "react";
import { buildExecutionSpans } from "../../../../../../components/execution/execution-utils";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/")({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(executionEventsQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
          pipelineId: params.pipelineId,
          executionId: params.executionId,
          limit: 500,
        })),
        context.queryClient.ensureQueryData(executionLogsQueryOptions({
          sourceId: params.sourceId,
          fileId: params.sourceFileId,
          pipelineId: params.pipelineId,
          executionId: params.executionId,
          limit: 500,
        })),
      ]);
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
  const { data: executionData } = useSuspenseQuery(executionEventsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    executionId,
    limit: 500,
  }));
  const { data: logsData } = useSuspenseQuery(executionLogsQueryOptions({
    sourceId,
    fileId: sourceFileId,
    pipelineId,
    executionId,
    limit: 500,
  }));

  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeSpan, setActiveSpan] = useState<ReturnType<typeof buildExecutionSpans>[number] | null>(null);

  const events = executionData.events
    .map((event) => event.data)
    .filter((event) => event != null);
  const spans = useMemo(() => buildExecutionSpans(events), [events]);

  const filteredLogs = useMemo(() => {
    if (!selectedSpanId) {
      return logsData.logs;
    }

    return logsData.logs.filter((log) => log.spanId === selectedSpanId);
  }, [logsData.logs, selectedSpanId]);

  function handleSpanSelect(spanId: string | null) {
    setSelectedSpanId(spanId);
    setExpandedLogId(null);
  }

  function handleSpanClick(span: ReturnType<typeof buildExecutionSpans>[number]) {
    setActiveSpan(span);
  }

  function handleLogToggle(logId: string) {
    setExpandedLogId((current) => current === logId ? null : logId);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
            params={{ sourceId, sourceFileId, pipelineId }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <StatusIcon status={executionData.status} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">
                Execution
                {" "}
                {executionId.slice(0, 8)}
              </h1>
              <StatusBadge status={executionData.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {executionData.pagination.total}
              {" "}
              events · Pipeline:
              {" "}
              {pipelineId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedSpanId && (
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                Filtered by span
              </div>
            )}

            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph"
              params={{ sourceId, sourceFileId, pipelineId, executionId }}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <GitBranch className="h-4 w-4" />
              View Graph
            </Link>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {logsData.truncated && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Logs truncated. Captured
              {" "}
              {formatBytes(logsData.capturedSize)}
              {" "}
              of
              {" "}
              {formatBytes(logsData.originalSize)}
              .
            </div>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Timeline</h2>
              </div>
              {selectedSpanId && (
                <div className="inline-flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <Filter className="h-3 w-3" />
                  Logs filtered to the selected span
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
            <div>
              <h2 className="text-sm font-semibold">Logs</h2>
              <p className="text-sm text-muted-foreground">
                {selectedSpanId
                  ? "Showing logs for the selected span."
                  : "Showing all captured logs for this execution."}
              </p>
            </div>
            <ExecutionLogTable
              logs={filteredLogs}
              expandedLogId={expandedLogId}
              onToggle={handleLogToggle}
            />
          </section>
        </div>
      </ScrollArea>

      <ExecutionSpanDrawer
        span={activeSpan}
        baseTime={events.length > 0 ? (events[0]?.timestamp ?? 0) : 0}
        onClose={() => setActiveSpan(null)}
      />
    </div>
  );
}
