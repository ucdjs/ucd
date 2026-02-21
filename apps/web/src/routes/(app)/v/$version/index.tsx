import { versionDetailsQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
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
  const { data: versionDetails } = useSuspenseQuery(versionDetailsQueryOptions(version));
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const isLatest = versions[0]?.version === version;
  const stats = versionDetails.statistics;
  const hasStats = stats.totalCharacters > 0;
  const hasNewItems = stats.newCharacters + stats.newBlocks + stats.newScripts > 0;
  const mappedVersion = versionDetails.mappedUcdVersion ?? version;
  const statusConfig = getStatusConfig(versionDetails.type);

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
      <section className="rounded-2xl border bg-card/60 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-[240px] flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Unicode
                  {" "}
                  {version}
                </h1>
                <Badge className={statusConfig.className} variant="secondary">
                  {statusConfig.label}
                </Badge>
                {isLatest && (
                  <Badge className="bg-primary/10 text-primary dark:bg-primary/20" variant="secondary">
                    Latest
                  </Badge>
                )}
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Explore the data and files for Unicode
                {" "}
                {version}
                . Search characters, browse blocks, and dive into the source files for this release.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span>
                  Released
                  {" "}
                  {versionDetails.date ?? "Unknown"}
                </span>
                <span className="hidden sm:inline">·</span>
                <span>
                  UCD mapping
                  {" "}
                  {mappedVersion}
                </span>
                {versionDetails.documentationUrl && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <a
                      href={versionDetails.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <BookOpen className="size-3" />
                      Docs
                    </a>
                  </>
                )}
                <span className="hidden sm:inline">·</span>
                <a
                  href={versionDetails.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Source
                </a>
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
                <Link to="/file-explorer/$" params={{ _splat: `${version}/` }}>
                  <FileText className="size-4" />
                  Open file tree
                </Link>
              )}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">At a glance</CardTitle>
          </CardHeader>
          <CardContent>
            {hasStats
              ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard
                      label="Characters"
                      value={stats.totalCharacters}
                      delta={stats.newCharacters}
                    />
                    <StatCard
                      label="Blocks"
                      value={stats.totalBlocks}
                      delta={stats.newBlocks}
                    />
                    <StatCard
                      label="Scripts"
                      value={stats.totalScripts}
                      delta={stats.newScripts}
                    />
                  </div>
                )
              : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Statistics are not available for this version yet.
                  </div>
                )}
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">What&apos;s new in this release</CardTitle>
          </CardHeader>
          <CardContent>
            {hasStats && hasNewItems
              ? (
                  <div className="grid gap-3">
                    <NewStatRow label="New characters" value={stats.newCharacters} />
                    <NewStatRow label="New blocks" value={stats.newBlocks} />
                    <NewStatRow label="New scripts" value={stats.newScripts} />
                  </div>
                )
              : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No new counts are recorded for this release.
                  </div>
                )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Explore this version</h2>
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
            params={{ _splat: `${version}/` }}
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
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Common files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <FileLink
              label="UnicodeData.txt"
              path={`${version}/ucd/UnicodeData.txt`}
            />
            <FileLink
              label="Blocks.txt"
              path={`${version}/ucd/Blocks.txt`}
            />
            <FileLink
              label="Scripts.txt"
              path={`${version}/ucd/Scripts.txt`}
            />
            <FileLink
              label="DerivedCoreProperties.txt"
              path={`${version}/ucd/DerivedCoreProperties.txt`}
            />
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ResourceRow label="Documentation" href={versionDetails.documentationUrl} />
            <ResourceRow label="Source archive" href={versionDetails.url} />
            <ResourceRow label="API base" href={`https://api.ucdjs.dev/api/v1/versions/${version}`} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type VersionStatus = "stable" | "draft" | "unsupported";

function getStatusConfig(status: VersionStatus) {
  switch (status) {
    case "draft":
      return {
        label: "Draft",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
      };
    case "unsupported":
      return {
        label: "Unsupported",
        className: "bg-muted text-muted-foreground",
      };
    default:
      return {
        label: "Stable",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
      };
  }
}

interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
}

function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-background/40 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value.toLocaleString()}</div>
      {delta && delta > 0
        ? (
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +
              {delta.toLocaleString()}
              {" "}
              new
            </div>
          )
        : null}
    </div>
  );
}

function NewStatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background/40 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function FileLink({ label, path }: { label: string; path: string }) {
  return (
    <Link
      to="/file-explorer/v/$"
      params={{ _splat: path }}
      className="flex items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
    >
      <span>{label}</span>
      <FileText className="size-4" />
    </Link>
  );
}

function ResourceRow({ label, href }: { label: string; href?: string | null }) {
  if (!href) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed px-2 py-1.5 text-muted-foreground">
        <span>{label}</span>
        <span className="text-xs">Unavailable</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
    >
      <span>{label}</span>
      <BookOpen className="size-4" />
    </a>
  );
}

function VersionPageSkeleton({ version }: { version: string }) {
  const statSkeletonKeys = ["stat-card-1", "stat-card-2", "stat-card-3"];
  const newStatSkeletonKeys = ["new-stat-1", "new-stat-2", "new-stat-3"];

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
      <section className="rounded-2xl border bg-card/60 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Unicode
              {" "}
              {version}
            </h1>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-36 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">At a glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {statSkeletonKeys.map((key) => (
                <Skeleton key={key} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">What&apos;s new in this release</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {newStatSkeletonKeys.map((key) => (
                <Skeleton key={key} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
