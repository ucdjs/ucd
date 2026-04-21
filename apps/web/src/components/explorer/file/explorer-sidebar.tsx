import type { SearchQueryParams } from "../../../lib/file-explorer";
import { directoryListingQueryOptions } from "#functions/files";
import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { Input, Skeleton } from "@ucdjs-internal/shared-ui/components";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo } from "react";
import { buildRootSidebarNodes } from "../../../lib/file-explorer-tree";
import { useFileExplorerSidebarStore } from "../../../stores/file-explorer-sidebar";
import { ExplorerFileTree } from "./explorer-file-tree";

export function ExplorerSidebar() {
  const filters = useSearch({ strict: false }) as Partial<SearchQueryParams>;
  const params = useParams({ strict: false });
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const { data: rootDirectory } = useSuspenseQuery(directoryListingQueryOptions({
    path: "",
    ...filters,
  }));
  const sidebarQuery = useFileExplorerSidebarStore((state) => state.sidebarQuery);
  const setSidebarQuery = useFileExplorerSidebarStore((state) => state.setSidebarQuery);
  const deferredSidebarQuery = useDeferredValue(sidebarQuery);
  const currentPath = typeof params._splat === "string" ? params._splat : "";

  const rootNodes = useMemo(
    () => rootDirectory.type === "directory"
      ? buildRootSidebarNodes(rootDirectory.files, versions)
      : [],
    [rootDirectory, versions],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-background px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={sidebarQuery}
            onChange={(event) => setSidebarQuery(event.target.value)}
            placeholder="Filter names..."
            className="h-8 pl-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-4">
        <ExplorerFileTree
          nodes={rootNodes}
          currentPath={currentPath}
          filters={filters}
          searchTerm={deferredSidebarQuery}
        />
      </div>
    </div>
  );
}

ExplorerSidebar.Skeleton = () => (
  <div className="flex h-full flex-col">
    <div className="px-3 py-3">
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex-1 space-y-1 px-2 pb-4">
      <ExplorerFileTree.Skeleton depth={0} />
    </div>
  </div>
);
