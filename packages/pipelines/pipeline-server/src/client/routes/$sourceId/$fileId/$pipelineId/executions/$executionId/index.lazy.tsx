import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { ScrollArea } from "@ucdjs-internal/shared-ui/ui/scroll-area";
import {
  buildExecutionSpans,
  ExecutionLogTable,
  ExecutionSpanDrawer,
  ExecutionWaterfall,
  formatBytes,
  StatusBadge,
  StatusIcon,
} from "@ucdjs/pipelines-ui";
import { ArrowLeft, Filter } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/executions/$executionId/")({
  component: ExecutionDetailPage,
});

function ExecutionDetailPage() {
  const { sourceId, fileId, pipelineId, executionId } = Route.useParams();
  const { executionData, logsData } = Route.useLoaderData();
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeSpan, setActiveSpan] = useState<ReturnType<typeof buildExecutionSpans>[number] | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const events = executionData.events.map((e) => e.data);
  const spans = useMemo(() => buildExecutionSpans(events), [events]);

  const filteredLogs = useMemo(() => {
    if (!selectedSpanId) return logsData.logs;
    return logsData.logs.filter((log) => log.spanId === selectedSpanId);
  }, [logsData.logs, selectedSpanId]);

  const handleSpanSelect = (spanId: string | null) => {
    setSelectedSpanId(spanId);
    setExpandedLogId(null);
  };

  const handleSpanClick = (span: ReturnType<typeof buildExecutionSpans>[number]) => {
    setActiveSpan(span);
  };

  const handleLogToggle = (logId: string) => {
    setExpandedLogId((current) => (current === logId ? null : logId));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/$sourceId/$fileId/$pipelineId/executions"
            params={{ sourceId, fileId, pipelineId }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <StatusIcon status={executionData.status} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">
                Execution {executionId.slice(0, 8)}
              </h1>
              <StatusBadge status={executionData.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {executionData.pagination.total} events · Pipeline: {pipelineId}
            </p>
          </div>

          {selectedSpanId && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filtered by span
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {logsData.truncated && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Logs truncated. Captured {formatBytes(logsData.capturedSize)} of {formatBytes(logsData.originalSize)}.
            </div>
          )}

          <ExecutionWaterfall
            spans={spans}
            selectedSpanId={selectedSpanId}
            onSelect={handleSpanSelect}
            onSpanClick={handleSpanClick}
          />

          <div className="space-y-4">
            <ExecutionLogTable
              logs={filteredLogs}
              expandedLogId={expandedLogId}
              onToggle={handleLogToggle}
            />
          </div>
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
