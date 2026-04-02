import { VersionCardItem } from "#components/home/versions/version-card-item";
import { versionDetailsQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ThemeToggle, ThemeToggleFallback, UcdLogo } from "@ucdjs-internal/shared-ui/components";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ArrowRight, ArrowUpRight, Check, ChevronsUpDown, Code2, Layers, Search, Terminal } from "lucide-react";
import { Suspense, useMemo, useState } from "react";

export const Route = createFileRoute("/(home)/")({
  component: HomePage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(versionsQueryOptions());
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "UCD.js - Unicode Character Database",
      },
    ],
  }),
});

function getVersionBadge(date?: string | number, isDraft?: boolean) {
  const year = date ? Number.parseInt(String(date), 10) : undefined;
  const age = year ? new Date().getFullYear() - year : undefined;
  if (isDraft) return { label: "Draft", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  if (age === undefined) return { label: "Unknown", cls: "bg-muted text-muted-foreground" };
  if (age <= 1) return { label: "Recent", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  if (age <= 3) return { label: "Mature", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  if (age <= 5) return { label: "Old", cls: "bg-muted text-muted-foreground" };
  return { label: "Legacy", cls: "bg-muted/60 text-muted-foreground/80" };
}

function HomePage() {
  const { ucdjsApiBaseUrl } = useLoaderData({ from: "__root__" });
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const [showAllVersions, setShowAllVersions] = useState(false);

  const latestStable = useMemo(() => {
    return versions.find((version) => version.type === "stable") ?? versions[0];
  }, [versions]);

  const [selectedVersion, setSelectedVersion] = useState(() => latestStable?.version ?? "");
  const availableVersions = useMemo(() => new Set(versions.map((version) => version.version)), [versions]);
  const currentVersion = availableVersions.has(selectedVersion)
    ? selectedVersion
    : latestStable?.version || "";
  const currentVersionData = versions.find((v) => v.version === currentVersion);
  const currentBadge = currentVersionData
    ? getVersionBadge(currentVersionData.date ?? undefined, currentVersionData.type === "draft")
    : null;
  const recentVersions = useMemo(() => versions.slice(0, 4), [versions]);
  const visibleVersions = showAllVersions ? versions : recentVersions;

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-16 px-6 py-16">
        <div className="flex items-center justify-end">
          <ClientOnly fallback={<ThemeToggleFallback />}>
            <ThemeToggle />
          </ClientOnly>
        </div>
        <section className="flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-4">
            <UcdLogo className="size-12" />
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Unicode Toolkit</p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">UCD.js</h1>
            </div>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Explore Unicode releases, inspect characters, and navigate the raw UCD datasets with a focused, developer-friendly interface.
          </p>

          <Card className="w-full max-w-2xl bg-card/60 ring-1 ring-border/40">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-base ring-offset-background">
                    <span className="flex items-center gap-2">
                      <Layers className="size-4 text-muted-foreground" />
                      <span>
                        v
                        {currentVersion}
                      </span>
                      {currentBadge && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${currentBadge.cls}`}>
                          {currentBadge.label}
                        </span>
                      )}
                    </span>
                    <ChevronsUpDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="overflow-auto"
                    style={{ width: "var(--anchor-width)", maxHeight: "18rem" }}
                  >
                    {versions.map((version) => {
                      const badge = getVersionBadge(version.date ?? undefined, version.type === "draft");
                      const isCurrent = version.version === currentVersion;
                      return (
                        <DropdownMenuItem
                          key={version.version}
                          onSelect={(event) => {
                            event.preventDefault();
                            setSelectedVersion(version.version);
                          }}
                          onClick={() => setSelectedVersion(version.version)}
                          className={isCurrent ? "bg-accent text-accent-foreground" : undefined}
                        >
                          <span className="size-4 shrink-0 flex items-center justify-center">
                            {isCurrent && <Check className="size-3.5" />}
                          </span>
                          <span className="flex-1">
                            v
                            {version.version}
                          </span>
                          <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                size="default"
                nativeButton={false}
                className="justify-center sm:min-w-40"
                render={(
                  <Link to="/v/$version" params={{ version: currentVersion }}>
                    Explore version
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              />
            </CardContent>
          </Card>

          <Suspense fallback={<HomeStatsSkeleton />}>
            <HomeStats version={currentVersion} />
          </Suspense>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <Link to="/search" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Search className="size-3.5" />
              Search
            </Link>
            <span>•</span>
            <Link to="/file-explorer" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Terminal className="size-3.5" />
              File explorer
            </Link>
            <span>•</span>
            <a
              href={ucdjsApiBaseUrl ?? "https://api.ucdjs.dev"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <Code2 className="size-3.5" />
              API reference
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <Layers className="size-4" />
              Unicode versions
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setShowAllVersions((prev) => !prev)}
            >
              {showAllVersions ? "Show recent" : "Show all versions"}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleVersions.map((version) => (
              <VersionCardItem
                key={version.version}
                version={version}
                isLatest={version.version === latestStable?.version}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function HomeStats({ version }: { version: string }) {
  const { data } = useSuspenseQuery(versionDetailsQueryOptions(version));
  const stats = data.statistics;

  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
      <StatCard label="Selected version" value={`v${data.version}`} meta={data.date ?? ""} />
      <StatCard label="Total codepoints" value={stats.totalCharacters.toLocaleString()} meta="Characters" />
      <StatCard label="Total blocks" value={stats.totalBlocks.toLocaleString()} meta="Unicode blocks" />
    </div>
  );
}

function HomeStatsSkeleton() {
  const skeletonKeys = useMemo(() => Array.from({ length: 3 }, (_, index) => `home-stat-skeleton-${index}`), []);

  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
      {skeletonKeys.map((key) => (
        <Card key={key} className="bg-card/60">
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <Card className="bg-card/60 ring-1 ring-border/40">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
        {meta
          ? <p className="text-xs text-muted-foreground">{meta}</p>
          : null}
      </CardContent>
    </Card>
  );
}
