import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { versionsQueryOptions } from "@/functions/versions";

export function VersionsCardList() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());

  const latestVersion = versions[0];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {versions.map((version) => (
        <Link
          key={version.version}
          to="/v/$version"
          params={{ version: version.version }}
          className="group flex flex-col gap-2 rounded-lg border bg-card p-3 hover:bg-accent hover:border-accent transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-base">{version.version}</span>
            <ArrowRight className="size-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {version.version === latestVersion?.version && (
              <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="size-3" />
                Latest
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                version.type === "stable"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : version.type === "draft"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-gray-500/15 text-gray-700 dark:text-gray-400"
              }`}
            >
              {version.type}
            </span>
            {version.date && (
              <span className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                {version.date}
              </span>
            )}
          </div>

          {/* Documentation link */}
          <div className="text-xs text-muted-foreground truncate">
            <a
              href={version.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-foreground transition-colors"
            >
              View documentation
            </a>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function VersionsCardListSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`card-skeleton-${i}`}
          className="flex flex-col gap-2 rounded-lg border bg-card p-3 animate-pulse"
        >
          <div className="h-5 bg-muted rounded w-20" />
          <div className="flex gap-1.5">
            <div className="h-5 bg-muted rounded-full w-12" />
            <div className="h-5 bg-muted rounded-full w-16" />
          </div>
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      ))}
    </div>
  );
}
