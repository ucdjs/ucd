import type { UnicodeVersion } from "@ucdjs/schemas";
import type { VersionFilters } from "./versions-toolbar";
import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { VersionCardItem, VersionCardItemSkeleton } from "./version-card-item";
import { VersionsToolbar } from "./versions-toolbar";

type AgeFilter = "all" | "recent" | "legacy";

const AGE_RECENT_MAX = 3;
const AGE_LEGACY_MIN = 8;

function getAgeBucket(date: string | null) {
  if (!date) return null;
  const year = Number.parseInt(date, 10);
  if (Number.isNaN(year)) return null;
  const age = new Date().getFullYear() - year;
  return age;
}

function matchesAgeFilter(version: UnicodeVersion, filter: AgeFilter) {
  if (filter === "all") return true;
  const age = getAgeBucket(version.date);

  if (age == null) return filter === "legacy";
  if (filter === "recent") return age <= AGE_RECENT_MAX;
  return age >= AGE_LEGACY_MIN;
}

export function VersionsCardList() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const [filters, setFilters] = useState<VersionFilters>({
    query: "",
    typeFilter: "all",
    ageFilter: "all",
  });

  const latestStable = versions.find((v) => v.type === "stable");

  const filteredVersions = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    return versions.filter((version) => {
      if (filters.typeFilter !== "all" && version.type !== filters.typeFilter) return false;
      if (!matchesAgeFilter(version, filters.ageFilter)) return false;
      if (!normalizedQuery) return true;
      return (
        version.version.toLowerCase().includes(normalizedQuery)
        || version.type.toLowerCase().includes(normalizedQuery)
        || (version.date ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [versions, filters]);

  return (
    <div className="space-y-4">
      <VersionsToolbar filters={filters} onFiltersChange={setFilters} />

      {filteredVersions.length === 0
        ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No versions match these filters.
            </div>
          )
        : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVersions.map((version) => {
                const isLatestStable = version.version === latestStable?.version;

                return (
                  <VersionCardItem
                    key={version.version}
                    version={version}
                    isLatest={isLatestStable}
                  />
                );
              })}
            </div>
          )}
    </div>
  );
}

export function VersionsCardListSkeleton() {
  const skeletonKeys = useState(() => Array.from({ length: 6 }, (_, index) => `card-skeleton-${index}`))[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-48 rounded-lg border bg-card/60 animate-pulse" />
        <div className="h-8 w-24 rounded-lg border bg-card/60 animate-pulse" />
        <div className="h-8 w-24 rounded-lg border bg-card/60 animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skeletonKeys.map((key) => (
          <VersionCardItemSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
