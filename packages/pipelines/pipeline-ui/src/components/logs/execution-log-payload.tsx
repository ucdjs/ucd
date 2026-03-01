import type { ExecutionLogItem } from "../../types";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";

export interface ExecutionLogPayloadPanelProps {
  log: ExecutionLogItem | null;
}

export function ExecutionLogPayloadPanel({ log }: ExecutionLogPayloadPanelProps) {
  if (!log) return null;

  const payload = log.payload ?? { message: log.message, stream: log.stream };
  const jsonString = JSON.stringify(payload, null, 2);

  return (
    <div className="border border-border rounded-lg bg-background p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Payload</div>
        {payload.event && (
          <Badge variant="outline" className="text-xs">
            {payload.event.type}
          </Badge>
        )}
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
