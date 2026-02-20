import { versionDetailsQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { BookOpen, FileText, Grid3X3, Search, Type } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

export const Route = createFileRoute("/(app)/v/$version/")({
  component: VersionPage,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(versionsQueryOptions());
    context.queryClient.prefetchQuery(versionDetailsQueryOptions(params.version));
  },
});

function VersionPage() {
  const { version } = Route.useParams();

  return (
    <Suspense fallback={<VersionPageSkeleton version={version} />}>
      <VersionPageContent version={version} />
    </Suspense>
  );
}

function VersionPageContent({ version }: { version: string }) {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const versionData = versions.find((v) => v.version === version);
  const isLatest = versions[0]?.version === version;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setIsSearching(true);
    navigate({
      to: "/search",
      search: { q: trimmed, version },
    });
  }

  useEffect(() => {
    if (!isSearching) return;
    const timeout = setTimeout(() => setIsSearching(false), 800);
    return () => clearTimeout(timeout);
  }, [isSearching]);

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Unicode
                {" "}
                {version}
              </h1>
              {isLatest && (
                <span className="text-xs bg-primary/10 text-primary dark:bg-primary/20 px-2 py-1 rounded-full">
                  Latest
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                nativeButton={false}
                render={(
                  <Link to="/search" search={{ version }}>
                    <Search className="size-4" />
                    Search characters
                  </Link>
                )}
              />
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={(
                  <Link to="/v/$version/blocks" params={{ version }}>
                    <Grid3X3 className="size-4" />
                    Browse blocks
                  </Link>
                )}
              />
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={(
                  <Link to="/v/$version/u/$hex" params={{ version, hex: "0041" }}>
                    <Type className="size-4" />
                    Inspect codepoint
                  </Link>
                )}
              />
            </div>
          </div>
          <form onSubmit={handleSearch} className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search characters..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching
              ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    opening…
                  </span>
                )
              : null}
          </form>
        </div>
        {versionData && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                Released
                {" "}
                {versionData.date}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="capitalize">{versionData.type}</span>
              {versionData.documentationUrl && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <a
                    href={versionData.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <BookOpen className="size-3" />
                    Docs
                  </a>
                </>
              )}
              <span className="hidden sm:inline">·</span>
              <a
                href={versionData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Source
              </a>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Explore the data and files for Unicode
              {" "}
              {version}
              . Inspect new characters, review version metadata, and navigate the source files for this release.
            </p>
          </>
        )}
      </div>

      <Suspense fallback={<VersionStatisticsSkeleton />}>
        <VersionStatistics version={version} />
      </Suspense>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/v/$version/blocks"
            params={{ version }}
            className="group"
          >
            <Card className="h-full transition-colors hover:bg-accent/50 dark:hover:bg-accent/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="size-5 text-primary" />
                  <CardTitle className="text-base">Browse Blocks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Explore Unicode blocks and their character ranges
              </CardContent>
            </Card>
          </Link>
          <Link
            to="/search"
            search={{ version }}
            className="group"
          >
            <Card className="h-full transition-colors hover:bg-accent/50 dark:hover:bg-accent/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Search className="size-5 text-primary" />
                  <CardTitle className="text-base">Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Search characters by name, codepoint, or properties
              </CardContent>
            </Card>
          </Link>
          <Link
            to="/v/$version/u/$hex"
            params={{ version, hex: "0041" }}
            className="group"
          >
            <Card className="h-full transition-colors hover:bg-accent/50 dark:hover:bg-accent/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Type className="size-5 text-primary" />
                  <CardTitle className="text-base">Codepoint Inspector</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Inspect individual characters and their properties
              </CardContent>
            </Card>
          </Link>
          <Link
            to="/file-explorer/$"
            params={{ _splat: "" }}
            className="group"
          >
            <Card className="h-full transition-colors hover:bg-accent/50 dark:hover:bg-accent/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <CardTitle className="text-base">File Explorer</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Browse raw UCD database files and their structure
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function VersionStatistics({ version }: { version: string }) {
  const { data: details } = useSuspenseQuery(versionDetailsQueryOptions(version));

  if (!details || details.statistics.totalCharacters === 0) {
    return null;
  }

  const { statistics } = details;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <StatBadge
        label="Characters"
        value={statistics.totalCharacters}
        newValue={statistics.newCharacters}
      />
      <StatBadge
        label="Blocks"
        value={statistics.totalBlocks}
        newValue={statistics.newBlocks}
      />
      <StatBadge
        label="Scripts"
        value={statistics.totalScripts}
        newValue={statistics.newScripts}
      />
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: number;
  newValue?: number;
}

function StatBadge({ label, value, newValue }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
      <span className="font-semibold">{value.toLocaleString()}</span>
      <span className="text-muted-foreground">{label.toLowerCase()}</span>
      {newValue != null && newValue > 0 && (
        <span className="text-xs text-green-600 dark:text-green-400">
          (+
          {newValue.toLocaleString()}
          {" "}
          new)
        </span>
      )}
    </div>
  );
}

function VersionStatisticsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {["stat-1", "stat-2", "stat-3"].map((key) => (
        <Skeleton key={key} className="h-8 w-32 rounded-md" />
      ))}
    </div>
  );
}

function VersionPageSkeleton({ version }: { version: string }) {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Unicode
                {" "}
                {version}
              </h1>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-36 rounded-md" />
              <Skeleton className="h-7 w-32 rounded-md" />
              <Skeleton className="h-7 w-36 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-full max-w-xs rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <VersionStatisticsSkeleton />
    </div>
  );
}
