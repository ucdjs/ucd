import type { FileFilter, ViewMode } from "@/types/file-explorer";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { EntryList } from "@/components/file-explorer/entry-list";
import { ExplorerToolbar } from "@/components/file-explorer/explorer-toolbar";
import { ParentDirectory } from "@/components/file-explorer/parent-directory";
import { ExplorerNotFound } from "@/components/not-found";

import { Skeleton } from "@/components/ui/skeleton";
import { filesQueryOptions, getFileHeadInfo } from "@/functions/files";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/file-explorer/$")({
  component: DirectoryExplorerPage,
  async beforeLoad({ params, search }) {
    const path = params._splat || "";
    const { statType, amount } = await getFileHeadInfo({ data: { path, search } });

    if (statType !== "directory") {
      throw redirect({
        to: "/file-explorer/v/$",
        params: { _splat: path },
      });
    }

    return {
      path,
      statType,
      amount,
      search,
    };
  },
  loader: async ({ context }) => {
    context.queryClient.prefetchQuery(filesQueryOptions({
      path: context.path,
      pattern: context.search.pattern,
      sort: context.search.sort,
      order: context.search.order,
    }));

    return {
      amount: context.amount,
      search: context.search,
    };
  },
  notFoundComponent: DirectoryNotFoundBoundary,
});

function DirectoryExplorerPage() {
  const { _splat: path = "" } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FileFilter>({ type: "all" });
  const { amount } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-4">
      <ExplorerToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
      />

      <div
        className={cn(
          viewMode === "cards"
            ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "flex flex-col rounded-lg border border-border overflow-hidden",
        )}
      >
        {path && <ParentDirectory currentPath={path} viewMode={viewMode} />}
        <Suspense
          fallback={(
            <EntryListSkeleton
              amount={amount}
              viewMode={viewMode}
            />
          )}
        >
          <EntryList
            currentPath={path}
            searchTerm={searchTerm}
            viewMode={viewMode}
            filter={filter}
          />
        </Suspense>
      </div>

      <FileStats />
    </div>
  );
}

function FileStats() {
  const { amount } = Route.useLoaderData();

  return (
    <div className="text-xs text-muted-foreground">
      {amount.directories}
      {" "}
      {amount.directories === 1 ? "directory" : "directories"}
      ,
      {" "}
      {amount.files}
      {" "}
      {amount.files === 1 ? "file" : "files"}
      {amount.total && ` (filtered from ${amount.total} total)`}
    </div>
  );
}

function EntryListSkeleton({
  amount,
  viewMode,
}: {
  amount: { total: number; files: number; directories: number };
  viewMode: ViewMode;
}) {
  // Show skeletons for total count (files + directories)
  const skeletonCount = amount.total || 5;

  if (viewMode === "cards") {
    return (
      <>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={`skeleton-card-${i}`} className="rounded-lg border border-border p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: skeletonCount }, (_, i) => (
        <div
          key={`skeleton-list-${i}`}
          className={cn(
            "flex items-center gap-3 px-3 py-2",
            "border-b border-border/50 last:border-b-0",
          )}
        >
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </>
  );
}

function DirectoryNotFoundBoundary() {
  const { _splat } = Route.useParams();

  return <ExplorerNotFound path={_splat ?? ""} />;
}
