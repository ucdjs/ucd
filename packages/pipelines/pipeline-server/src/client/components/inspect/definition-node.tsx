import type { NodeProps } from "@xyflow/react";
import type { DefinitionFlowNode } from "./definition-graph-utils";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import { NODE_HEIGHT, NODE_WIDTH } from "./definition-graph-utils";

function DefinitionRouteNode({
  data,
  selected = false,
}: NodeProps<DefinitionFlowNode>) {
  const { routeId, route } = data;

  return (
    <div
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
      className={`rounded-xl border-2 px-3 py-2 transition-shadow ${
        selected
          ? "border-foreground/60 bg-muted/30 shadow-md ring-2 ring-primary/40"
          : "border-border bg-card shadow-sm hover:shadow-md"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-none !bg-muted-foreground" />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{routeId}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>
              T:
              {route.transforms.length}
            </span>
            <span>
              O:
              {route.outputs.length}
            </span>
            {route.cache && <span className="inline-block size-1.5 rounded-full bg-emerald-500" title="Cacheable" />}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-none !bg-muted-foreground" />
    </div>
  );
}

export const DefinitionRouteNodeRenderer = memo(DefinitionRouteNode);
