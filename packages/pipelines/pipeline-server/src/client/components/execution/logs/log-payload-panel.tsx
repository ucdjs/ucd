<<<<<<< HEAD
import type { ExecutionLogItem } from "#shared/schemas/execution";
=======
import type { ExecutionLogItem } from "#shared/types";
>>>>>>> 2cb96a13 (Bootstrap fs-backend package and execution log UI)
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { LogLevelBadge } from "./log-level-badge";

interface LogPayloadPanelProps {
  log: ExecutionLogItem;
}

export function LogPayloadPanel({ log }: LogPayloadPanelProps) {
<<<<<<< HEAD
  const payload = log.payload;
  if (!payload) {
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/40 rounded p-3 leading-relaxed">
        <code>{log.message}</code>
      </pre>
    );
  }

=======
  const payload = log.payload ?? { message: log.message, stream: log.stream };
>>>>>>> 2cb96a13 (Bootstrap fs-backend package and execution log UI)
  const { level, source, event } = payload;

  return (
    <div className="border border-border rounded-lg bg-background p-4 space-y-3">
<<<<<<< HEAD
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground self-center">Level</span>
        <LogLevelBadge level={level} className="justify-self-start" />

        <span className="text-muted-foreground self-center">Source</span>
        <Badge variant="outline" className="font-mono justify-self-start">{source}</Badge>

        {event && (
          <>
            <span className="text-muted-foreground self-center">Event</span>
            <Badge variant="outline" className="justify-self-start">{event.type}</Badge>
          </>
=======
      <div className="flex items-center gap-2 flex-wrap">
        {level && <LogLevelBadge level={level} />}
        {source && (
          <Badge variant="outline" className="text-xs font-mono">
            {source}
          </Badge>
        )}
        {event && (
          <Badge variant="outline" className="text-xs">
            {event.type}
          </Badge>
>>>>>>> 2cb96a13 (Bootstrap fs-backend package and execution log UI)
        )}
      </div>

      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/40 rounded p-3 leading-relaxed">
        <code>{JSON.stringify(payload, null, 2)}</code>
      </pre>
    </div>
  );
}
