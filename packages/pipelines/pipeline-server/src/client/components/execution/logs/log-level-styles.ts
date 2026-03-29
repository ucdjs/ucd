import type { ExecutionLogItem } from "#shared/schemas/execution";

type Level = NonNullable<ExecutionLogItem["level"]>;

/** Base text color per level (used by badge) */
export const LEVEL_COLOR: Record<Level, string> = {
  debug: "text-muted-foreground",
  info: "text-sky-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

/** Left-edge border color for log rows */
export const LEVEL_BORDER: Record<Level, string> = {
  debug: "bg-muted-foreground/40",
  info: "bg-sky-400",
  warn: "bg-yellow-400",
  error: "bg-red-400",
};

export type FilterLevel = Level | "unknown";

/** Filter pill (inactive state) */
export const LEVEL_PILL: Record<FilterLevel, string> = {
  debug: "text-muted-foreground hover:bg-muted",
  info: "text-sky-400 hover:bg-sky-400/10",
  warn: "text-yellow-400 hover:bg-yellow-400/10",
  error: "text-red-400 hover:bg-red-400/10",
  unknown: "text-muted-foreground/60 hover:bg-muted",
};

/** Filter pill (active state) */
export const LEVEL_PILL_ACTIVE: Record<FilterLevel, string> = {
  debug: "bg-muted text-foreground",
  info: "bg-sky-400/20 text-sky-400",
  warn: "bg-yellow-400/20 text-yellow-400",
  error: "bg-red-400/20 text-red-400",
  unknown: "bg-muted text-foreground",
};
