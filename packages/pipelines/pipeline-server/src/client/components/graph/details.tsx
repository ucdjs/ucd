import type { PipelineGraphNode } from "@ucdjs/pipelines-core";
import { cn } from "#lib/utils";
import { X } from "lucide-react";

export interface PipelineGraphDetailsProps {
  node: PipelineGraphNode | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/70 p-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
      <span className="break-all font-mono text-sm text-foreground">{value}</span>
    </div>
  );
}

function NodeDetails({ node }: { node: PipelineGraphNode }) {
  switch (node.type) {
    case "source":
      return <DetailRow label="Version" value={node.version} />;
    case "file":
      return (
        <>
          <DetailRow label="Name" value={node.file.name} />
          <DetailRow label="Path" value={node.file.path} />
          <DetailRow label="Directory" value={node.file.dir} />
          <DetailRow label="Extension" value={node.file.ext} />
          <DetailRow label="Version" value={node.file.version} />
        </>
      );
    case "route":
      return <DetailRow label="Route ID" value={node.routeId} />;
    case "artifact":
      return <DetailRow label="Artifact ID" value={node.artifactId} />;
    case "output":
      return (
        <>
          <DetailRow label="Output Index" value={String(node.outputIndex)} />
          {node.property && <DetailRow label="Property" value={node.property} />}
        </>
      );
  }
}

function getBadgeClassName(type: string) {
  switch (type) {
    case "source":
      return "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300";
    case "file":
      return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300";
    case "route":
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
    case "artifact":
      return "bg-violet-500/12 text-violet-600 dark:text-violet-300";
    case "output":
      return "bg-sky-500/12 text-sky-600 dark:text-sky-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function PipelineGraphDetails({
  node,
  onClose,
}: PipelineGraphDetailsProps) {
  if (!node) {
    return null;
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className={cn("rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]", getBadgeClassName(node.type))}>
          {node.type}
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
          <DetailRow label="Node ID" value={node.id} />
          <NodeDetails node={node} />
        </div>
      </div>
    </div>
  );
}
