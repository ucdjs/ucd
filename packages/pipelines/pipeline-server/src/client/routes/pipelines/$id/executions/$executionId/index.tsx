import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { StatusBadge } from "#components/pipeline-overview/status-badge";
import { StatusIcon } from "#components/pipeline-overview/status-icon";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ScrollArea } from "@ucdjs-internal/shared-ui/ui/scroll-area";
import {
  EventDetailPanel,
  formatHighPrecisionTime,
  InlineJsonView,
  useEventView,
  ViewModeToggle,
} from "@ucdjs/pipelines-ui";
import { ArrowLeft, CheckCircle2, ChevronRight, Clock, FileCode, XCircle } from "lucide-react";

interface ExecutionEvent {
  id: string;
  type: string;
  timestamp: string;
  data: PipelineEvent;
}

interface ExecutionEventsResponse {
  executionId: string;
  pipelineId: string;
  status: "running" | "completed" | "failed";
  events: ExecutionEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export async function fetchExecutionEvents(executionId: string): Promise<ExecutionEventsResponse> {
  const response = await fetch(`/api/executions/${executionId}/events?limit=500`);
  if (!response.ok) {
    throw new Error("Failed to fetch execution events");
  }
  return response.json();
}

function EventItem({
  event,
  isJsonMode,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
}: {
  event: PipelineEvent;
  isJsonMode: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  const timestamp = formatHighPrecisionTime(event.timestamp);
  const version = "version" in event ? event.version : undefined;
  const routeId = "routeId" in event ? event.routeId : undefined;
  const artifactId = "artifactId" in event ? event.artifactId : undefined;
  const durationMs = "durationMs" in event ? event.durationMs : undefined;

  const handleClick = () => {
    if (isJsonMode) {
      onToggleExpand();
    } else {
      onSelect();
    }
  };

  return (
    <div
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        isSelected && !isJsonMode && "bg-muted/50",
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isSelected && !isJsonMode && "rotate-90",
          )}
        />

        <Badge variant="outline" className="shrink-0 text-xs">
          {event.type}
        </Badge>

        <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">
          {timestamp}
        </span>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {version && (
            <Badge variant="secondary" className="text-xs shrink-0">
              v
              {version}
            </Badge>
          )}
          {routeId && (
            <span className="text-sm text-foreground truncate flex items-center gap-1">
              <FileCode className="h-3 w-3 text-muted-foreground" />
              {routeId}
            </span>
          )}
          {artifactId && (
            <span className="text-sm text-muted-foreground truncate">
              {artifactId}
            </span>
          )}
        </div>

        {durationMs != null && (
          <span className="text-xs text-muted-foreground shrink-0">
            {durationMs < 1 ? `${(durationMs * 1000).toFixed(0)}μs` : `${durationMs.toFixed(2)}ms`}
          </span>
        )}
      </button>

      {isJsonMode && isExpanded && (
        <div className="px-4 pb-3 pl-12">
          <InlineJsonView event={event} />
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/pipelines/$id/executions/$executionId/")({
  component: ExecutionDetailPage,
  loader: async ({ params }) => {
    const executionData = await fetchExecutionEvents(params.executionId);
    return { executionData };
  },
});

function ExecutionDetailPage() {
  const { id: pipelineId, executionId } = Route.useParams();
  const { executionData } = Route.useLoaderData();

  const {
    isJsonMode,
    selectedEventId,
    isDetailPanelOpen,
    toggleJsonMode,
    openDetailPanel,
    closeDetailPanel,
    toggleInlineExpansion,
    isInlineExpanded,
  } = useEventView();

  const events = executionData.events.map((e: ExecutionEvent) => e.data);
  const selectedEvent = events.find((e: PipelineEvent) => e.id === selectedEventId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/pipelines/$id/executions"
            params={{ id: pipelineId }}
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
              events • Pipeline:
              {pipelineId}
            </p>
          </div>

          <ViewModeToggle isJsonMode={isJsonMode} onToggle={toggleJsonMode} />
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {events.length === 0
            ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No events recorded for this execution</p>
                </div>
              )
            : (
                <div className="divide-y divide-border">
                  {events.map((event: PipelineEvent) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      isJsonMode={isJsonMode}
                      isExpanded={isInlineExpanded(event.id)}
                      isSelected={event.id === selectedEventId}
                      onToggleExpand={() => toggleInlineExpansion(event.id)}
                      onSelect={() => openDetailPanel(event.id)}
                    />
                  ))}
                </div>
              )}
        </ScrollArea>
      </div>

      <EventDetailPanel
        event={selectedEvent}
        isOpen={isDetailPanelOpen}
        onClose={closeDetailPanel}
        events={events}
      />
    </div>
  );
}
