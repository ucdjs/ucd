import type { FilesResponse } from "#functions/files";
import type { SearchQueryParams } from "../../lib/file-explorer";
import type { SidebarNode } from "../../lib/file-explorer-tree";
import { directoryListingQueryOptions } from "#functions/files";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Badge, Skeleton } from "@ucdjs-internal/shared-ui/components";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import {
  filterSidebarNodes,
  getIndentStyle,
  getRowIndentStyle,
  normalizeDirectoryEntries,
  TREE_INDENT,
  TREE_PADDING,
} from "../../lib/file-explorer-tree";
import { useFileExplorerSidebarStore } from "../../stores/file-explorer-sidebar";
import { ExplorerTreeEntry } from "./explorer-entry";

interface ExplorerFileTreeProps {
  nodes: SidebarNode[];
  currentPath: string;
  filters: Partial<SearchQueryParams>;
  searchTerm: string;
  depth?: number;
}

export function ExplorerFileTree({
  nodes,
  currentPath,
  filters,
  searchTerm,
  depth = 0,
}: ExplorerFileTreeProps) {
  const visibleNodes = useMemo(
    () => filterSidebarNodes(nodes, searchTerm),
    [nodes, searchTerm],
  );

  if (visibleNodes.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        No matches
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {visibleNodes.map((node) => (
        <ExplorerFileTreeNode
          key={node.path}
          node={node}
          depth={depth}
          currentPath={currentPath}
          filters={filters}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
}

interface ExplorerFileTreeNodeProps {
  node: SidebarNode;
  depth: number;
  currentPath: string;
  filters: Partial<SearchQueryParams>;
  searchTerm: string;
}

function ExplorerFileTreeNode({
  node,
  depth,
  currentPath,
  filters,
  searchTerm,
}: ExplorerFileTreeNodeProps) {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const isDirectory = node.type === "directory";
  const routeOpen = isPathActive(node.path, currentPath);
  const disclosure = useFileExplorerSidebarStore((state) => state.disclosureByPath[node.path]);
  const toggleDirectoryOpen = useFileExplorerSidebarStore((state) => state.toggleDirectoryOpen);
  const isOpen = isDirectory && (disclosure === "open" ? true : disclosure === "closed" ? false : routeOpen);

  const childrenQuery = useQuery({
    ...directoryListingQueryOptions({
      path: node.path,
      ...filters,
    }),
    enabled: isDirectory && isOpen,
  });

  return (
    <div>
      <ExplorerTreeEntry
        name={node.name}
        isDirectory={isDirectory}
        isExpanded={isOpen}
        active={routeOpen}
        indent={depth * TREE_INDENT + TREE_PADDING}
        onSelect={() => navigate({
          to: isDirectory ? "/file-explorer/$" : "/file-explorer/v/$",
          params: { _splat: node.path },
        })}
        leading={isDirectory
          ? (
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleDirectoryOpen(node.path, routeOpen);
                }}
              >
                {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </button>
            )
          : (
              <span className="inline-flex size-4 items-center justify-center">
                <ChevronRight className="size-3 opacity-0" />
              </span>
            )}
        trailing={node.badge ? <Badge variant="secondary" className="text-[10px]">{node.badge}</Badge> : undefined}
      />

      {isDirectory && isOpen && (
        <ExplorerFileTreeNodeChildren
          depth={depth + 1}
          currentPath={currentPath}
          filters={filters}
          searchTerm={searchTerm}
          data={childrenQuery.data}
          isLoading={childrenQuery.isLoading}
        />
      )}
    </div>
  );
}

interface ExplorerFileTreeNodeChildrenProps {
  depth: number;
  currentPath: string;
  filters: Partial<SearchQueryParams>;
  searchTerm: string;
  data: FilesResponse | undefined;
  isLoading: boolean;
}

function ExplorerFileTreeNodeChildren({
  depth,
  currentPath,
  filters,
  searchTerm,
  data,
  isLoading,
}: ExplorerFileTreeNodeChildrenProps) {
  if (isLoading) {
    return <ExplorerFileTree.Skeleton depth={depth} />;
  }

  if (!data || data.type !== "directory") {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        Failed
      </div>
    );
  }

  return (
    <ExplorerFileTree
      nodes={normalizeDirectoryEntries(data.files)}
      currentPath={currentPath}
      filters={filters}
      searchTerm={searchTerm}
      depth={depth}
    />
  );
}

function isPathActive(nodePath: string, currentPath: string) {
  return currentPath === nodePath || currentPath.startsWith(`${nodePath}/`);
}

ExplorerFileTree.Skeleton = ({ depth = 0 }: { depth?: number }) => (
  <div className="space-y-1">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="flex items-center gap-2 rounded-md py-1 pr-2 text-sm"
        style={getRowIndentStyle(depth)}
      >
        <Skeleton className="h-4 w-4 rounded shrink-0" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    ))}
  </div>
);
