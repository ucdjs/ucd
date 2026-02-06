import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import {
  EventDetailPanel,
  formatHighPrecisionTime,
  InlineJsonView,
  SimpleTimeline,
  useEventView,
  ViewModeToggle,
} from "@ucdjs/pipelines-ui";
import { ArrowLeft } from "lucide-react";

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

async function fetchExecutionEvents(executionId: string): Promise<ExecutionEventsResponse> {
  const response = await fetch(`/api/executions/${executionId}/events?limit=500`);
  if (!response.ok) {
    throw new Error("Failed to fetch execution events");
  }
  return response.json();
}

function EventRow({
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

  const message = "message" in event ? String(event.message) : undefined;
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
      className={`rounded-md border transition-all ${
        isSelected && !isJsonMode ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex flex-wrap items-center gap-2 px-3 py-2 text-sm text-left ${
          !isJsonMode && "cursor-pointer"
        }`}
      >
        <Badge variant="outline">{event.type}</Badge>
        <span className="text-muted-foreground text-xs font-mono">{timestamp}</span>

        {version && (
          <Badge variant="secondary">
            v
            {version}
          </Badge>
        )}
        {routeId && <Badge variant="secondary">{routeId}</Badge>}
        {artifactId && <Badge variant="secondary">{artifactId}</Badge>}

        {durationMs != null && (
          <span className="text-muted-foreground text-xs">
            {durationMs < 1 ? `${(durationMs * 1000).toFixed(0)}μs` : `${durationMs.toFixed(2)}ms`}
          </span>
        )}

        {message && <span className="text-destructive">{message}</span>}
      </button>

      {isJsonMode && isExpanded && (
        <div className="px-3 pb-3">
          <InlineJsonView event={event} />
        </div>
      )}
    </div>
  );
}

function EmptyEventsState() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      No events yet. This execution may still be running or has no recorded events.
    </p>
  );
}

export const Route = createFileRoute("/pipelines/$id/executions/$executionId")({
  component: ExecutionDetailPage,
  loader: async ({ params }) => {
    const executionData = await fetchExecutionEvents(params.executionId);
    return { executionData };
  },
});

function ExecutionDetailPage() {
  const { id: pipelineId, executionId } = useParams({
    from: "/pipelines/$id/executions/$executionId",
  });
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
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          render={() => (
            <Link to="/pipelines/$id/executions" params={{ id: pipelineId }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Executions
            </Link>
          )}
        />
        <div>
          <h1 className="text-lg font-semibold">
            Execution
            {executionId.slice(0, 8)}
            ...
          </h1>
          <p className="text-sm text-muted-foreground">
            Pipeline:
            {pipelineId}
          </p>
        </div>
        <Badge
          variant={
            executionData.status === "completed"
              ? "default"
              : executionData.status === "failed"
                ? "destructive"
                : "secondary"
          }
        >
          {executionData.status}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Events (
            {executionData.pagination.total}
            )
          </CardTitle>
          <ViewModeToggle isJsonMode={isJsonMode} onToggle={toggleJsonMode} />
        </CardHeader>
        <CardContent className="space-y-3">
          <SimpleTimeline
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => openDetailPanel(id)}
          />

          {events.length === 0
            ? (
                <EmptyEventsState />
              )
            : (
                <div className="space-y-2" role="list" aria-label="Execution events">
                  {events.map((event: PipelineEvent) => (
                    <EventRow
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
        </CardContent>
      </Card>

      <EventDetailPanel
        event={selectedEvent}
        isOpen={isDetailPanelOpen}
        onClose={closeDetailPanel}
        events={events}
      />
    </div>
  );
}
