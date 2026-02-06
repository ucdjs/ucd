import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import {
  formatHighPrecisionTime,
  InlineJsonView,
  LogDetailPanel,
  SimpleTimeline,
  useExecute,
  useLogView,
  ViewModeToggle,
} from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/pipelines/$id/logs")({
  component: PipelineLogsPage,
});

function LogEventRow({
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
      className={cn(
        "rounded-md border transition-all",
        isSelected && !isJsonMode ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full flex flex-wrap items-center gap-2 px-3 py-2 text-sm text-left",
          !isJsonMode && "cursor-pointer",
        )}
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

function EmptyLogsState() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      No logs yet. Execute the pipeline to see execution logs.
    </p>
  );
}

function PipelineLogsPage() {
  const { result } = useExecute();
  const {
    isJsonMode,
    selectedEventId,
    isDetailPanelOpen,
    toggleJsonMode,
    openDetailPanel,
    closeDetailPanel,
    toggleInlineExpansion,
    isInlineExpanded,
  } = useLogView();

  const events = result?.events ?? [];
  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  return (
    <div className="p-6">
      <Card role="tabpanel" id="tabpanel-logs" aria-labelledby="tab-logs">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Execution Logs</CardTitle>
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
                <EmptyLogsState />
              )
            : (
                <div className="space-y-2" role="list" aria-label="Execution logs">
                  {events.map((event) => (
                    <LogEventRow
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

      <LogDetailPanel
        event={selectedEvent}
        isOpen={isDetailPanelOpen}
        onClose={closeDetailPanel}
        events={events}
      />
    </div>
  );
}
