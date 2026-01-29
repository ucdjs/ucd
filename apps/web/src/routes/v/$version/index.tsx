import { versionDetailsQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { BookOpen, Search } from "lucide-react";
import { Suspense, useState } from "react";

export const Route = createFileRoute("/v/$version/")({
  component: VersionPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(versionsQueryOptions());
    context.queryClient.ensureQueryData(versionDetailsQueryOptions(params.version));
  },
});

function VersionPage() {
  const { version } = Route.useParams();
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const versionData = versions.find((v) => v.version === version);
  const isLatest = versions[0]?.version === version;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: "/search",
        search: { q: searchQuery.trim(), version },
      });
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/">Home</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Unicode
                  {version}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Version Header - Compact */}
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Unicode
                {" "}
                {version}
              </h1>
              {isLatest && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Latest
                </span>
              )}
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
            </form>
          </div>
          {versionData && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Released
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
                Unicode
                {" "}
                {version}
                {" "}
                introduces support for a comprehensive set of characters covering major world scripts,
                {" "}
                <span className="font-medium">mathematical symbols</span>
                , emoji, and technical characters. This release
                includes updates to the Unicode Standard across multiple writing systems and symbol categories.
              </p>
            </>
          )}
        </div>

        {/* Version Statistics */}
        <Suspense fallback={<VersionStatisticsSkeleton />}>
          <VersionStatistics version={version} />
        </Suspense>
      </div>
    </>
  );
}

function VersionStatistics({ version }: { version: string }) {
  const { data: details } = useQuery(versionDetailsQueryOptions(version));

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
