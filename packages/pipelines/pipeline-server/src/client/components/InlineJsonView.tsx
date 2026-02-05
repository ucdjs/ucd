import type { PipelineEvent } from "@ucdjs/pipelines-core";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";

interface InlineJsonViewProps {
  event: PipelineEvent;
}

export function InlineJsonView({ event }: InlineJsonViewProps) {
  const jsonString = JSON.stringify(event, null, 2);

  return (
    <div className="rounded-md border bg-muted/30 p-3 mt-2">
      <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
        <code className="text-foreground">{jsonString}</code>
      </pre>
    </div>
  );
}
