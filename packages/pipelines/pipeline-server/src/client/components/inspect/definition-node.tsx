import type { DefinitionOutputNodeData, DefinitionRouteNodeData, FlowNode } from "#lib/graph-utils";
import type { NodeProps } from "@xyflow/react";
import { DEFINITION_NODE_HEIGHT, DEFINITION_NODE_WIDTH, OUTPUT_NODE_HEIGHT, OUTPUT_NODE_WIDTH } from "#lib/graph-utils";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

function DefinitionRouteNode({
  data,
  selected = false,
}: NodeProps<FlowNode>) {
  const d = data as DefinitionRouteNodeData;

  return (
    <div
      style={{ width: DEFINITION_NODE_WIDTH, minHeight: DEFINITION_NODE_HEIGHT }}
      className={`rounded-xl border-2 px-3 py-2 transition-shadow ${
        selected
          ? "border-foreground/60 bg-muted/30 shadow-md ring-2 ring-primary/40"
          : "border-border bg-card shadow-sm hover:shadow-md"
      }`}
    >
      <Handle type="target" position={Position.Left} className="h-2! w-2! border-none! bg-muted-foreground!" />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{d.routeId}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>
              T:
              {d.route.transforms.length}
            </span>
            <span>
              O:
              {d.route.outputs.length}
            </span>
            {d.route.cache && <span className="inline-block size-1.5 rounded-full bg-emerald-500" title="Cacheable" />}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="h-2! w-2! border-none! bg-muted-foreground!" />
    </div>
  );
}

function DefinitionOutputNode({
  data,
}: NodeProps<FlowNode>) {
  const d = data as DefinitionOutputNodeData;

  return (
    <div
      style={{ width: OUTPUT_NODE_WIDTH, minHeight: OUTPUT_NODE_HEIGHT }}
      className="cursor-pointer rounded-lg border border-dashed border-border bg-card px-3 py-1.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <Handle type="target" position={Position.Left} className="h-2! w-2! border-none! bg-muted-foreground!" />

      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-foreground">{d.fileName}</div>
        <div className="truncate text-[10px] text-muted-foreground">{d.dir}</div>
      </div>
    </div>
  );
}

export const DefinitionRouteNodeRenderer = memo(DefinitionRouteNode);
export const DefinitionOutputNodeRenderer = memo(DefinitionOutputNode);
