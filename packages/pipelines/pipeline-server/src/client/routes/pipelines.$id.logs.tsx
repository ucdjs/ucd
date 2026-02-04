import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { usePipelineDetailContext } from "../hooks/pipeline-detail-context";

export const Route = createFileRoute("/pipelines/$id/logs")({
  component: PipelineLogsPage,
});

interface LogEventDisplayProps {
  event: PipelineEvent;
  index: number;
}

function LogEventDisplay({ event }: LogEventDisplayProps) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString();

  // Extract optional fields safely
  const message = "message" in event ? String(event.message) : undefined;
  const version = "version" in event ? event.version : undefined;
  const routeId = "routeId" in event ? event.routeId : undefined;
  const artifactId = "artifactId" in event ? event.artifactId : undefined;
  const durationMs = "durationMs" in event ? event.durationMs : undefined;

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
      role="listitem"
    >
      <Badge variant="outline">{event.type}</Badge>
      <time className="text-muted-foreground" dateTime={new Date(event.timestamp).toISOString()}>
        {timestamp}
      </time>

      {version && (
        <Badge variant="secondary">
          v
          {version}
        </Badge>
      )}

      {routeId && <Badge variant="secondary">{routeId}</Badge>}
      {artifactId && <Badge variant="secondary">{artifactId}</Badge>}

      {durationMs != null && (
        <span className="text-muted-foreground">
          {Math.round(durationMs)}
          ms
        </span>
      )}

      {message && (
        <span className="text-destructive">{message}</span>
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

function LogsList({ events }: { events: readonly PipelineEvent[] }) {
  return (
    <div className="space-y-2" role="list" aria-label="Execution logs">
      {events.map((event, index) => (
        <LogEventDisplay
          key={`${event.type}-${event.timestamp}-${String(index)}`}
          event={event}
          index={index}
        />
      ))}
    </div>
  );
}

function PipelineLogsPage() {
  const { execution } = usePipelineDetailContext();

  return (
    <Card
      role="tabpanel"
      id="tabpanel-logs"
      aria-labelledby="tab-logs"
    >
      <CardHeader>
        <CardTitle>Execution Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {execution.events.length === 0
          ? (
              <EmptyLogsState />
            )
          : (
              <LogsList events={execution.events} />
            )}
      </CardContent>
    </Card>
  );
}
