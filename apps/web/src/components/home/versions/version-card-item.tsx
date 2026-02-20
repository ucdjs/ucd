import type { UnicodeVersion } from "@ucdjs/schemas";
import { Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { ArrowRight, Calendar, Code, Sparkles, Tag } from "lucide-react";

function getBadgeLabel(type: UnicodeVersion["type"]) {
  if (type === "stable") {
    return "border-green-600/30 text-green-700 bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:bg-green-950/30";
  }

  if (type === "draft") {
    return "border-amber-600/30 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:bg-amber-950/30";
  }

  if (type === "unsupported") {
    return "border-muted-foreground/30 text-muted-foreground bg-muted/30 dark:border-muted-foreground/20 dark:bg-muted/50";
  }
}

interface VersionCardItemProps {
  /**
   * The Unicode version details to display in the card.
   */
  version: UnicodeVersion;

  /**
   * Indicates if this version is the latest stable release, which will trigger special styling (e.g., a sparkle icon).
   * This is determined by the parent component based on the list of versions.
   */
  isLatest: boolean;
}

export function VersionCardItem({ version, isLatest }: VersionCardItemProps) {
  const badgeClasses = getBadgeLabel(version.type);
  return (
    <Link
      to="/v/$version"
      params={{ version: version.version }}
      className="group relative flex flex-col gap-2 rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="flex items-center gap-2">
        {isLatest ? <Sparkles className="size-4 text-primary shrink-0" /> : <Code className="size-4 text-muted-foreground shrink-0" />}
        <span className="font-semibold text-base">{version.version}</span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-medium flex items-center gap-1",
            badgeClasses,
          )}
        >
          <Tag className="size-2.5 shrink-0" />
          {version.type}
        </Badge>
        <ArrowRight className="size-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground ml-auto" />
      </div>

      <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
        INSERT DESCRIPTION HERE
      </div>

      {version.date && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="size-3 shrink-0" />
          <span>{version.date}</span>
        </div>
      )}
    </Link>
  );
}

export function VersionCardItemSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted rounded shrink-0" />
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded-full w-14 shrink-0" />
        <div className="h-4 w-4 bg-muted rounded ml-auto" />
      </div>
      <div className="h-4 bg-muted rounded w-full" />
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 bg-muted rounded shrink-0" />
        <div className="h-3 bg-muted rounded w-12" />
      </div>
    </div>
  );
}
