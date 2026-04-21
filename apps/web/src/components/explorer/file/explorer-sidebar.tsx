import type { SearchQueryParams } from "../../../lib/file-explorer";
import { ExplorerSidebarShell } from "#components/explorer/sidebar/explorer-sidebar-shell";
import { directoryListingQueryOptions } from "#functions/files";
import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { Skeleton } from "@ucdjs-internal/shared-ui/components";
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
    <ExplorerSidebarShell
      query={sidebarQuery}
      onQueryChange={setSidebarQuery}
      placeholder="Filter names..."
    >
      <ExplorerFileTree
        nodes={rootNodes}
        currentPath={currentPath}
        filters={filters}
        searchTerm={deferredSidebarQuery}
      />
    </ExplorerSidebarShell>
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
