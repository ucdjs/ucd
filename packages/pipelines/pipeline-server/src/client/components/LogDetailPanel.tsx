import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

interface LogDetailPanelProps {
  event: PipelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  events: readonly PipelineEvent[];
}

export function LogDetailPanel({ event, isOpen, onClose, events }: LogDetailPanelProps) {
  if (!event || !isOpen) return null;

  const jsonString = JSON.stringify(event, null, 2);

  // Find related events (previous and next)
  const eventIndex = events.findIndex((e) => e.id === event.id);
  const previousEvent = eventIndex > 0 ? events[eventIndex - 1] : null;
  const nextEvent = eventIndex < events.length - 1 ? events[eventIndex + 1] : null;

  // Calculate time differences
  const timeDiff = (e1: PipelineEvent, e2: PipelineEvent) => {
    const diff = e2.timestamp - e1.timestamp;
    return diff > 1000 ? `${(diff / 1000).toFixed(1)}s` : `${diff}ms`;
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-[500px] bg-background border-l border-border z-50",
          "transform transition-transform duration-300 ease-in-out",
          "shadow-2xl overflow-hidden flex flex-col",
        )}
      >
        <Card className="h-full rounded-none border-0 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div>
              <CardTitle className="text-base">Event Details</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                ID:
                {event.id}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyJson}>
                📋 Copy JSON
              </Button>
            </div>

            {/* JSON View */}
            <div className="rounded-md bg-muted/50 p-3">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                <code>{jsonString}</code>
              </pre>
            </div>

            {/* Timeline Context */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Timeline Context</h3>

              {previousEvent && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Previous:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{previousEvent.type}</Badge>
                    <span className="text-muted-foreground">
                      (
                      {timeDiff(previousEvent, event)}
                      {" "}
                      before)
                    </span>
                  </div>
                </div>
              )}

              {nextEvent && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Next:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{nextEvent.type}</Badge>
                    <span className="text-muted-foreground">
                      (
                      {timeDiff(event, nextEvent)}
                      {" "}
                      after)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
