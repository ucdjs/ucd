import type { ExecutionLogItem } from "#shared/schemas/execution";
import { formatTimestamp } from "#lib/format";
import { useClipboard } from "@ucdjs-internal/shared-ui/hooks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ucdjs-internal/shared-ui/ui/collapsible";
import { ScrollArea } from "@ucdjs-internal/shared-ui/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@ucdjs-internal/shared-ui/ui/sheet";
import { Check, ChevronDown, Copy } from "lucide-react";
import { LogLevelBadge } from "./log-level-badge";

interface LogDetailsProps {
  log: ExecutionLogItem | null;
  onClose: () => void;
}

export function LogDetails({ log, onClose }: LogDetailsProps) {
  const spanIdClip = useClipboard();

  const payload = log?.payload;
  const metaEntries = payload?.meta ? Object.entries(payload.meta) : [];
  const args = payload?.args && payload.args.length > 0 ? payload.args : null;
  const hasAdditional = args != null || metaEntries.length > 0;

  return (
    <Sheet open={log !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {log !== null && (
          <>
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="text-base">Log Details</SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="space-y-4 px-4 py-4">

                {/* Log Information card */}
                <div className="rounded-md border">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">Log Information</span>
                    <LogLevelBadge level={log.level} />
                  </div>
                  <div className="divide-y">
                    <InfoRow label="TIMESTAMP">
                      {formatTimestamp(log.timestamp)}
                    </InfoRow>
                    <InfoRow label="LEVEL">
                      <span className="font-mono uppercase">{log.level}</span>
                    </InfoRow>
                    <InfoRow label="SOURCE">
                      <span className="font-mono">{log.source}</span>
                    </InfoRow>
                    {log.spanId != null && (
                      <InfoRow label="SPAN ID">
                        <div className="flex items-center gap-1.5">
                          <code className="min-w-0 truncate font-mono text-xs">{log.spanId}</code>
                          <button
                            type="button"
                            onClick={() => spanIdClip.copy(log.spanId!)}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            {spanIdClip.copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </InfoRow>
                    )}
                  </div>

                  {hasAdditional && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex w-full items-center gap-1 border-t px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                        <ChevronDown className="h-3.5 w-3.5 transition-transform in-data-panel-open:rotate-180" />
                        Additional Details
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="divide-y border-t">
                          {args != null && args.map((arg, i) => (
                            <InfoRow key={i} label={`ARG ${i}`}>
                              <span className="break-all font-mono text-xs">
                                {typeof arg === "string" ? arg : JSON.stringify(arg)}
                              </span>
                            </InfoRow>
                          ))}
                          {metaEntries.map(([key, value]) => (
                            <InfoRow key={key} label={key.toUpperCase()}>
                              <span className="break-all font-mono text-xs">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </span>
                            </InfoRow>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>

                {/* Log Message card */}
                <div className="rounded-md border">
                  <div className="border-b px-3 py-2">
                    <span className="text-sm font-medium">Log Message</span>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs">
                    {log.message}
                  </pre>
                </div>

                {/* Raw JSON */}
                {payload != null && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground">
                      <ChevronDown className="h-3.5 w-3.5 transition-transform in-data-panel-open:rotate-180" />
                      Raw JSON
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="mt-2 overflow-auto rounded-md bg-muted px-3 py-2 text-xs">
                        {JSON.stringify(payload, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 px-3 py-2 text-sm">
      <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-right">{children}</span>
    </div>
  );
}
