import type { UnicodeVersion } from "@ucdjs/schemas";
import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { ArrowRight, Calendar, Filter, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

type VersionTypeFilter = "all" | "stable" | "draft" | "unsupported";
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
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<VersionTypeFilter>("all");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");

  const latestStable = versions.find((v) => v.type === "stable");

  const filteredVersions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return versions.filter((version) => {
      if (typeFilter !== "all" && version.type !== typeFilter) return false;
      if (!matchesAgeFilter(version, ageFilter)) return false;
      if (!normalizedQuery) return true;
      return (
        version.version.toLowerCase().includes(normalizedQuery)
        || version.type.toLowerCase().includes(normalizedQuery)
        || (version.date ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [versions, query, typeFilter, ageFilter]);

  const hasActiveFilters = Boolean(query.trim()) || typeFilter !== "all" || ageFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search versions..."
            className="pl-8 pr-8 h-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query
            ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setQuery("")}
                >
                  <X className="size-3" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )
            : null}
        </div>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger render={(props) => (
              <Button
                {...props}
                variant={typeFilter !== "all" ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline text-xs">
                  {typeFilter === "all" ? "Type" : typeFilter}
                </span>
                {typeFilter !== "all" && (
                  <span
                    role="button"
                    className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      setTypeFilter("all");
                    }}
                  >
                    <X className="size-3" />
                  </span>
                )}
              </Button>
            )}
            >
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={typeFilter} onValueChange={(v) => setTypeFilter(v as VersionTypeFilter)}>
                  <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="stable">Stable</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="draft">Draft</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="unsupported">Unsupported</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={(props) => (
              <Button
                {...props}
                variant={ageFilter !== "all" ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
              >
                <Calendar className="size-4" />
                <span className="hidden sm:inline text-xs">
                  {ageFilter === "all" ? "Age" : ageFilter}
                </span>
                {ageFilter !== "all" && (
                  <span
                    role="button"
                    className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAgeFilter("all");
                    }}
                  >
                    <X className="size-3" />
                  </span>
                )}
              </Button>
            )}
            >
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Age</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={ageFilter} onValueChange={(v) => setAgeFilter(v as AgeFilter)}>
                  <DropdownMenuRadioItem value="all">All ages</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="recent">Recent</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="legacy">Legacy</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {hasActiveFilters
            ? (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => {
                    setQuery("");
                    setTypeFilter("all");
                    setAgeFilter("all");
                  }}
                >
                  <span className="text-xs">
                    {[
                      query.trim(),
                      typeFilter !== "all" ? typeFilter : null,
                      ageFilter !== "all" ? ageFilter : null,
                    ].filter(Boolean).length}
                    {" "}
                    filter
                    {[
                      query.trim(),
                      typeFilter !== "all" ? typeFilter : null,
                      ageFilter !== "all" ? ageFilter : null,
                    ].filter(Boolean).length > 1
                      ? "s"
                      : ""}
                  </span>
                  <X className="size-3" />
                </Badge>
              )
            : null}
        </div>
      </div>

      {filteredVersions.length === 0
        ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No versions match these filters.
            </div>
          )
        : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVersions.map((version) => {
                const isLatestStable = version.version === latestStable?.version;

                return (
                  <Link
                    key={version.version}
                    to="/v/$version"
                    params={{ version: version.version }}
                    className="group flex flex-col gap-2 rounded-xl border bg-card/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base">{version.version}</span>
                      <ArrowRight className="size-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      INSERT DESCRIPTION HERE
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {isLatestStable && (
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          <Sparkles className="size-3" />
                          Latest
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${
                          version.type === "stable"
                            ? "border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : version.type === "draft"
                              ? "border-amber-500/20 text-amber-700 dark:text-amber-400"
                              : "border-muted-foreground/20 text-muted-foreground"
                        }`}
                      >
                        {version.type}
                      </Badge>
                      {version.date && (
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {version.date}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
    </div>
  );
}

export function VersionsCardListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-48 rounded-lg border bg-card/60 animate-pulse" />
        <div className="h-8 w-24 rounded-lg border bg-card/60 animate-pulse" />
        <div className="h-8 w-24 rounded-lg border bg-card/60 animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`card-skeleton-${i}`}
            className="flex flex-col gap-2 rounded-xl border bg-card/70 p-4 animate-pulse"
          >
            <div className="h-5 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-28" />
            <div className="flex gap-1.5">
              <div className="h-5 bg-muted rounded-full w-12" />
              <div className="h-5 bg-muted rounded-full w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
