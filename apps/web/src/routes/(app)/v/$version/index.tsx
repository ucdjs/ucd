import { ExploreSections } from "#components/version-overview/explore-sections";
import { FeaturedBlocks, FeaturedBlocksSkeleton } from "#components/version-overview/featured-blocks";
import { QuickLookup } from "#components/version-overview/quick-lookup";
import { VersionStatistics, VersionStatisticsSkeleton } from "#components/version-overview/version-statistics";
import { blocksQueryOptions } from "#functions/blocks";
import { versionDetailsQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { BookOpen, Search } from "lucide-react";
import { Suspense, useState } from "react";

export const Route = createFileRoute("/(app)/v/$version/")({
  component: VersionPage,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(versionsQueryOptions());
    context.queryClient.prefetchQuery(versionDetailsQueryOptions(params.version));
    context.queryClient.prefetchQuery(blocksQueryOptions(params.version));
    return { crumb: "Overview" };
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
    <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
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
        )}
      </div>

      <Suspense fallback={<VersionStatisticsSkeleton />}>
        <VersionStatistics version={version} />
      </Suspense>

      <ExploreSections version={version} />

      <Suspense fallback={<FeaturedBlocksSkeleton />}>
        <FeaturedBlocks version={version} />
      </Suspense>

      <QuickLookup version={version} />
    </div>
  );
}
