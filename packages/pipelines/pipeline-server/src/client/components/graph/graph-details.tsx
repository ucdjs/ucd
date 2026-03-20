import type { ExecutionGraphDetailField, ExecutionGraphNodeView } from "#shared/schemas/graph";
import { getGraphNodeConfig, getNodeBadgeClassName } from "#shared/lib/graph";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { X } from "lucide-react";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/70 p-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function FieldValue({ field }: { field: ExecutionGraphDetailField }) {
  if (field.type === "json") {
    return (
      <pre className="overflow-x-auto rounded-md border border-border/70 bg-background p-3 text-xs text-foreground">
        <code>{JSON.stringify(field.value, null, 2)}</code>
      </pre>
    );
  }

  if (field.type === "content") {
    return (
      <div className="break-all whitespace-pre-wrap text-sm text-foreground">
        {formatFieldValue(field.value)}
      </div>
    );
  }

  return (
    <span className="break-all font-mono text-sm text-foreground">
      {formatFieldValue(field.value)}
    </span>
  );
}

function formatFieldValue(value: unknown): string {
  if (value == null || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

export function PipelineGraphDetails({
  node,
  onClose,
}: {
  node: ExecutionGraphNodeView | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  if (!node) {
    return null;
  }

  const nodeConfig = getGraphNodeConfig(node.nodeType);

  return (
    <div
      data-testid="pipeline-graph-details"
      className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className={cn("rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]", getNodeBadgeClassName(node.nodeType))}>
          {nodeConfig.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {node.detailFields.map((field) => (
            <DetailRow key={`${field.label}:${field.type}`} label={field.label}>
              <FieldValue field={field} />
            </DetailRow>
          ))}
          {node.actions && node.actions.length > 0 && (
            <DetailRow label="Actions">
              <div className="flex flex-wrap gap-2">
                {node.actions.map((action) => (
                  <Button
                    key={`${action.to}:${action.label}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate({
                        to: action.to as never,
                        params: action.params as never,
                        search: action.search as never,
                      });
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  );
}
