import type { WaterfallNode } from "#lib/waterfall";
import { formatDuration, formatTimestamp } from "#lib/format";
import { getSpanColor } from "#lib/waterfall";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, ScrollArea, Sheet, SheetContent, SheetHeader, SheetTitle } from "@ucdjs-internal/shared-ui/components";
import { useClipboard } from "@ucdjs-internal/shared-ui/hooks";
import { Check, ChevronDown, Copy } from "lucide-react";

interface SpanDetailsProps {
  node: WaterfallNode | null;
  onClose: () => void;
}

export function SpanDetails({ node, onClose }: SpanDetailsProps) {
  const traceIdClip = useClipboard();
  const spanIdClip = useClipboard();

  const attributes = node?.raw.attributes
    ? Object.entries(node.raw.attributes as Record<string, unknown>)
    : [];
  // eslint-disable-next-line react/purity -- React Compiler handles memoization
  const absoluteStart = node?.raw.startTimestamp != null
    ? formatTimestamp(new Date(node.raw.startTimestamp).toISOString())
    : "";

  return (
    <Sheet open={node !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {node !== null && (
          <>
            <SheetHeader className="border-b px-4 py-3">
              <div className="flex items-center gap-2 pr-8">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getSpanColor(node) }}
                />
                <SheetTitle className="truncate text-sm">{node.name}</SheetTitle>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="shrink-0 text-xs text-muted-foreground">Kind</span>
                <code className="min-w-0 truncate font-mono text-xs">{node.kind}</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">Status</span>
                <span className={`text-xs font-mono ${node.hasError ? "text-destructive" : ""}`}>
                  {node.hasError ? "error" : "ok"}
                </span>
              </div>

              {node.traceId !== null && (
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-xs text-muted-foreground">Trace ID</span>
                  <code className="min-w-0 truncate font-mono text-xs">{node.traceId}</code>
                  <button
                    type="button"
                    onClick={() => traceIdClip.copy(node.traceId!)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {traceIdClip.copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}

              {node.raw.spanId !== null && (
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-xs text-muted-foreground">Span ID</span>
                  <code className="min-w-0 truncate font-mono text-xs">{node.raw.spanId}</code>
                  <button
                    type="button"
                    onClick={() => spanIdClip.copy(node.raw.spanId!)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {spanIdClip.copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 px-4 py-3">
                <section>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Timing
                  </p>
                  <div className="space-y-1">
                    <TimingRow label="Duration">
                      {node.isInstant ? "-" : formatDuration(node.durationMs)}
                    </TimingRow>
                    <TimingRow label="Start offset">
                      {formatDuration(node.startMs)}
                    </TimingRow>
                    {!node.isInstant && (
                      <TimingRow label="End offset">
                        {formatDuration(node.startMs + node.durationMs)}
                      </TimingRow>
                    )}
                    <TimingRow label="Absolute start">
                      {absoluteStart}
                    </TimingRow>
                  </div>
                </section>

                {attributes.length > 0 && (
                  <section>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Attributes
                    </p>
                    <div className="space-y-1.5">
                      {attributes.map(([key, value]) => (
                        <AttributeRow key={key} label={key} value={value} />
                      ))}
                    </div>
                  </section>
                )}

                {node.raw.events.length > 0 && (
                  <section>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Events
                    </p>
                    <div className="space-y-2">
                      {node.raw.events.map((event, i) => {
                        const offsetMs = node.raw.startTimestamp != null
                          ? event.timestamp - node.raw.startTimestamp
                          : null;
                        const eventAttrs = event.attributes
                          ? Object.entries(event.attributes as Record<string, unknown>)
                          : [];
                        return (
                          <div key={i} className="rounded-md border px-3 py-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-medium">{event.kind}</span>
                              {offsetMs != null && (
                                <span className="text-muted-foreground">
                                  +
                                  {formatDuration(offsetMs)}
                                </span>
                              )}
                            </div>
                            {eventAttrs.length > 0 && (
                              <div className="mt-1.5 space-y-0.5">
                                {eventAttrs.map(([k, v]) => (
                                  <AttributeRow key={k} label={k} value={v} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {node.raw.attributes != null && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground">
                      <ChevronDown className="h-3.5 w-3.5 transition-transform in-data-panel-open:rotate-180" />
                      Raw JSON
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="mt-2 overflow-auto rounded-md bg-muted px-3 py-2 text-xs">
                        {JSON.stringify(node.raw.attributes, null, 2)}
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

function TimingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function AttributeRow({ label, value }: { label: string; value: unknown }) {
  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);

  return (
    <div className={`text-sm ${isObject ? "space-y-1" : "flex items-baseline gap-2"}`}>
      <span className={`text-xs text-muted-foreground ${isObject ? "block" : "w-28 shrink-0"}`}>
        {label}
      </span>
      {isObject && (
        <div className="ml-3 space-y-1 border-l pl-3">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <AttributeRow key={k} label={k} value={v} />
          ))}
        </div>
      )}
      {!isObject && (
        <span className="min-w-0 break-all font-mono text-xs">
          {isArray
            ? JSON.stringify(value)
            : value === null || value === undefined
              ? <span className="text-muted-foreground">-</span>
              : String(value)}
        </span>
      )}
    </div>
  );
}
