import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { cn } from "#lib/utils";

export interface SimpleTimelineProps {
  events: readonly PipelineEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

function getEventColor(type: string): string {
  if (type.startsWith("pipeline:")) return "bg-purple-500";
  if (type.startsWith("version:")) return "bg-blue-500";
  if (type.startsWith("artifact:")) return "bg-orange-500";
  if (type.startsWith("file:")) return "bg-green-500";
  if (type.startsWith("parse:")) return "bg-cyan-500";
  if (type.startsWith("resolve:")) return "bg-pink-500";
  if (type.startsWith("cache:")) return "bg-yellow-500";
  if (type === "error") return "bg-red-500";
  return "bg-gray-500";
}

function getEventLevel(type: string): number {
  if (type.startsWith("pipeline:")) return 0;
  if (type.startsWith("version:")) return 1;
  if (type.startsWith("artifact:")) return 2;
  return 3;
}

function formatDuration(ms: number): string {
  if (ms > 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms > 1) return `${ms.toFixed(1)}ms`;
  if (ms > 0.001) return `${(ms * 1000).toFixed(1)}μs`;
  return `${(ms * 1000000).toFixed(0)}ns`;
}

export function SimpleTimeline({ events, selectedEventId, onSelectEvent }: SimpleTimelineProps) {
  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const timestamps = sortedEvents.map((e) => e.timestamp);
  const startTime = Math.min(...timestamps);
  const endTime = Math.max(...timestamps);
  const totalDuration = Math.max(endTime - startTime, 1);

  const eventsByLevel: Record<number, PipelineEvent[]> = {};
  for (const event of sortedEvents) {
    const level = getEventLevel(event.type);
    if (!eventsByLevel[level]) {
      eventsByLevel[level] = [];
    }
    eventsByLevel[level].push(event);
  }

  const levels = Object.keys(eventsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Execution Timeline</h3>
        <span className="text-xs text-muted-foreground">
          {sortedEvents.length}
          {" "}
          events ·
          {formatDuration(totalDuration)}
        </span>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="h-full w-px bg-foreground"
              style={{ left: `${pct}%`, position: "absolute" }}
            />
          ))}
        </div>

        <div className="space-y-1 relative">
          {levels.map((level) => {
            const levelEvents = eventsByLevel[level] ?? [];

            return (
              <div key={level} className="relative h-8 flex items-center">
                <div className="absolute inset-0 bg-muted/50 rounded" />

                {levelEvents.map((event, index) => {
                  const isSelected = event.id === selectedEventId;
                  const color = getEventColor(event.type);

                  const hasDuration = "durationMs" in event
                    && typeof event.durationMs === "number"
                    && event.durationMs > 0;

                  const isStartEvent = event.type.endsWith(":start");

                  const eventOffset = event.timestamp - startTime;

                  let leftPercent: number;
                  let widthPercent: number;

                  if (totalDuration < 0.1) {
                    leftPercent = (index / Math.max(levelEvents.length - 1, 1)) * 90;
                    widthPercent = hasDuration ? 8 : 6;
                  } else if (hasDuration) {
                    const endPercent = (eventOffset / totalDuration) * 100;
                    const durationPercent = (event.durationMs / totalDuration) * 100;

                    leftPercent = Math.max(0, endPercent - durationPercent);
                    widthPercent = Math.min(durationPercent, endPercent);
                  } else {
                    leftPercent = (eventOffset / totalDuration) * 100;
                    widthPercent = 6;
                  }

                  const clampedLeft = Math.max(0, Math.min(leftPercent, 94));
                  const maxWidth = 100 - clampedLeft;
                  const clampedWidth = Math.max(3, Math.min(widthPercent, maxWidth));

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event.id)}
                      className={cn(
                        "absolute h-6 transition-all cursor-pointer",
                        color,
                        isStartEvent ? "rounded-r-sm rounded-l-none" : "rounded-sm",
                        hasDuration ? "opacity-90" : "opacity-100",
                        "hover:brightness-125 hover:scale-y-110",
                        isSelected && "ring-[3px] ring-white shadow-lg z-20 brightness-110 scale-y-110",
                      )}
                      style={{
                        left: `${clampedLeft}%`,
                        width: `${clampedWidth}%`,
                        minWidth: isStartEvent ? "8px" : "6px",
                      }}
                      title={`${event.type}${hasDuration ? ` (${formatDuration(event.durationMs)})` : ""}`}
                    >
                      {clampedWidth > 12 && (
                        <span className="text-[7px] text-white font-medium px-1 truncate block leading-6 drop-shadow-md">
                          {event.type}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[10px]">
        {[
          { color: "bg-purple-500", label: "Pipeline" },
          { color: "bg-blue-500", label: "Version" },
          { color: "bg-orange-500", label: "Artifact" },
          { color: "bg-green-500", label: "File" },
          { color: "bg-cyan-500", label: "Parse" },
          { color: "bg-pink-500", label: "Resolve" },
          { color: "bg-yellow-500", label: "Cache" },
          { color: "bg-red-500", label: "Error" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm", color)} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
