import { VersionCardItem } from "#components/home/versions/version-card-item";
import { UcdLogo } from "#components/ucd-logo";
import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "@ucdjs-internal/shared-ui/components/theme-toggle";
import { Layers } from "lucide-react";
import { useMemo } from "react";

export const Route = createLazyFileRoute("/(home)/versions")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const latestStable = useMemo(() => {
    return versions.find((version) => version.type === "stable") ?? versions[0];
  }, [versions]);

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-16 px-6 py-16">
        <div className="flex items-center justify-end">
          <ThemeToggle />
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
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <Layers className="size-4" />
              Unicode versions
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {versions.map((version) => (
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
