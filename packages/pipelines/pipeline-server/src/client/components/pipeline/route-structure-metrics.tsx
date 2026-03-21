import { cn } from "@ucdjs-internal/shared-ui";
import type { LucideIcon } from "lucide-react";
import { Boxes, FolderTree, Layers3, Route as RouteIcon } from "lucide-react";

export interface RouteStructureMetricsProps {
  routes?: number;
  dependencies: number;
  transforms: number;
  outputs: number;
  className?: string;
  compact?: boolean;
}

export function RouteStructureMetrics({
  routes,
  dependencies,
  transforms,
  outputs,
  className,
  compact = false,
}: RouteStructureMetricsProps) {
  const items = [
    routes == null
      ? null
      : {
          icon: RouteIcon,
          label: "Routes",
          value: routes,
        },
    {
      icon: FolderTree,
      label: "Dependencies",
      value: dependencies,
    },
    {
      icon: Layers3,
      label: "Transforms",
      value: transforms,
    },
    {
      icon: Boxes,
      label: "Outputs",
      value: outputs,
    },
  ].filter((item): item is {
    icon: LucideIcon;
    label: string;
    value: number;
  } => item != null);

  return (
    <div className={cn("flex flex-wrap gap-x-3 gap-y-2", className)}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={cn(
              "inline-flex items-center gap-1.5 text-muted-foreground",
              compact ? "text-[11px]" : "text-xs",
            )}
            aria-label={`${item.label}: ${item.value}`}
            title={`${item.label}: ${item.value}`}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            <span className="font-medium tabular-nums text-foreground">{item.value}</span>
            <span className="sr-only">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
