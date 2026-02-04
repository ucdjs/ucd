import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { InlineJsonView } from "../components/InlineJsonView";
import { LogDetailPanel } from "../components/LogDetailPanel";
import { SimpleTimeline } from "../components/SimpleTimeline";
import { ViewModeToggle } from "../components/ViewModeToggle";
import { usePipelineDetailContext } from "../hooks/pipeline-detail-context";
import { useLogView } from "../hooks/use-log-view";

export const Route = createFileRoute("/pipelines/$id/logs")({
  component: PipelineLogsPage,
});

interface LogEventRowProps {
  event: PipelineEvent;
  index: number;
  isJsonMode: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}

function formatHighPrecisionTime(ms: number): string {
  // Format as seconds with 6 decimal places for microsecond precision
  const seconds = Math.floor(ms / 1000);
  const fractionalMs = ms % 1000;
  return `${seconds}.${fractionalMs.toFixed(3).padStart(6, "0")}s`;
}

function LogEventRow({
  event,
  isJsonMode,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
}: LogEventRowProps) {
  const timestamp = formatHighPrecisionTime(event.timestamp);

  // Extract optional fields safely
  const message = "message" in event ? String(event.message) : undefined;
  const version = "version" in event ? event.version : undefined;
  const routeId = "routeId" in event ? event.routeId : undefined;
  const artifactId = "artifactId" in event ? event.artifactId : undefined;
  const durationMs = "durationMs" in event ? event.durationMs : undefined;

  // In JSON mode: click expands inline JSON
  // In Compact mode: click opens detail panel
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
        <span className="text-muted-foreground text-xs font-mono">
          {timestamp}
        </span>

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

      {/* Inline JSON view (only in JSON mode) */}
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
  const { execution } = usePipelineDetailContext();
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

  // Memoize events to prevent unnecessary re-renders
  const events = execution.events;
  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  return (
    <>
      <Card role="tabpanel" id="tabpanel-logs" aria-labelledby="tab-logs">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Execution Logs</CardTitle>
          <ViewModeToggle isJsonMode={isJsonMode} onToggle={toggleJsonMode} />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Timeline (above logs) */}
          <SimpleTimeline
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => {
              openDetailPanel(id);
            }}
          />

          {execution.events.length === 0
            ? (
                <EmptyLogsState />
              )
            : (
                <div className="space-y-2" role="list" aria-label="Execution logs">
                  {execution.events.map((event, index) => (
                    <LogEventRow
                      key={event.id}
                      event={event}
                      index={index}
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

      {/* Detail Panel (500px slide-out) */}
      <LogDetailPanel
        event={selectedEvent}
        isOpen={isDetailPanelOpen}
        onClose={closeDetailPanel}
        events={execution.events}
      />
    </>
  );
}
