import { VersionCardItem } from "#components/home/versions/version-card-item";
import { UcdLogo } from "#components/ucd-logo";
import { versionDetailsQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ThemeToggle, ThemeToggleFallback } from "@ucdjs-internal/shared-ui/components/theme-toggle";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ucdjs-internal/shared-ui/ui/select";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ArrowRight, ArrowUpRight, Code2, Layers, Search, Terminal } from "lucide-react";
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
                <Select value={currentVersion} onValueChange={(value) => setSelectedVersion(value ?? "")}>
                  <SelectTrigger className="w-full h-10 text-base">
                    <SelectValue placeholder="Select a Unicode version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.version} value={version.version}>
                        <span className="flex w-full items-center justify-between gap-3">
                          <span>
                            v
                            {version.version}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {version.type}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
