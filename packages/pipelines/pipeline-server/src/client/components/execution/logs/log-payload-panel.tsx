import type { ExecutionLogItem } from "#shared/schemas/execution";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { LogLevelBadge } from "./log-level-badge";

interface LogPayloadPanelProps {
  log: ExecutionLogItem;
}

export function LogPayloadPanel({ log }: LogPayloadPanelProps) {
  const payload = log.payload;
  if (!payload) {
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/40 rounded p-3 leading-relaxed">
        <code>{log.message}</code>
      </pre>
    );
  }

  const { level, source, traceKind } = payload;

  return (
    <div className="border border-border rounded-lg bg-background p-4 space-y-3">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground self-center">Level</span>
        <LogLevelBadge level={level} className="justify-self-start" />

        <span className="text-muted-foreground self-center">Source</span>
        <Badge variant="outline" className="font-mono justify-self-start">{source}</Badge>

        {traceKind && (
          <>
            <span className="text-muted-foreground self-center">Trace</span>
            <Badge variant="outline" className="justify-self-start">{traceKind}</Badge>
          </>
        )}
      </div>

      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/40 rounded p-3 leading-relaxed">
        <code>{JSON.stringify(payload, null, 2)}</code>
      </pre>
    </div>
  );
}
