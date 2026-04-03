import type { OverviewActivityDay, OverviewExecutionSummary } from "#shared/schemas/overview";
import type { ExecutionStatus } from "@ucdjs/pipeline-executor";
import { AlertTriangle, CheckCircle2, PlayCircle, XCircle } from "lucide-react";

export interface OverviewStateDefinition {
  key: string;
  label: string;
  statuses: ExecutionStatus[];
  segmentClassName: string;
  markerClassName: string;
  icon: typeof CheckCircle2;
}

export const overviewStates: OverviewStateDefinition[] = [
  {
    key: "completed",
    label: "Completed",
    statuses: ["completed"],
    segmentClassName: "bg-emerald-500/85",
    markerClassName: "bg-emerald-500/85",
    icon: CheckCircle2,
  },
  {
    key: "failed",
    label: "Failed",
    statuses: ["failed"],
    segmentClassName: "bg-red-500/85",
    markerClassName: "bg-red-500/85",
    icon: AlertTriangle,
  },
  {
    key: "running",
    label: "Running",
    statuses: ["pending", "running"],
    segmentClassName: "bg-amber-500/85",
    markerClassName: "bg-amber-500/85",
    icon: PlayCircle,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    statuses: ["cancelled"],
    segmentClassName: "bg-slate-500/85",
    markerClassName: "bg-slate-500/85",
    icon: XCircle,
  },
];

export function formatDayLabel(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

export function getStateCount(
  stateCounts: OverviewActivityDay | OverviewExecutionSummary,
  definition: OverviewStateDefinition,
) {
  return definition.statuses.reduce((sum, status) => sum + stateCounts[status], 0);
}
