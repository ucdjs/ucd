import type { SearchQueryParams } from "../../lib/file-explorer";
import type { SidebarNode } from "../../lib/file-explorer-tree";
import { directoryListingQueryOptions } from "#functions/files";
import { versionsQueryOptions } from "#functions/versions";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Badge, Input, Skeleton } from "@ucdjs-internal/shared-ui/components";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  buildRootSidebarNodes,
  filterSidebarNodes,
  getIndentStyle,
  getRowIndentStyle,
  normalizeDirectoryEntries,
  normalizeExplorerPath,
  TREE_INDENT,
  TREE_PADDING,
} from "../../lib/file-explorer-tree";
import { useFileExplorerSidebarStore } from "../../stores/file-explorer-sidebar";
import { ExplorerTreeEntry } from "./explorer-entry";

export function ExplorerSidebar() {
  const filters = useSearch({ strict: false }) as Partial<SearchQueryParams>;
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const { data: rootDirectory } = useSuspenseQuery(directoryListingQueryOptions({
    path: "",
    ...filters,
  }));
  const { filterText, setFilterText } = useFileExplorerSidebarStore(useShallow((state) => ({
    filterText: state.filterText,
    setFilterText: state.setFilterText,
  })));

  const rootNodes = rootDirectory.type === "directory"
    ? buildRootSidebarNodes(rootDirectory.files, versions)
    : [];
  const filteredRootNodes = filterSidebarNodes(rootNodes, filterText);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-background px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Filter tree..."
            className="h-8 pl-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-4">
        <div className="space-y-1">
          {filteredRootNodes.map((node) => (
            <ExplorerSidebarNode
              key={node.path}
              node={node}
              depth={0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ExplorerSidebarNodeProps {
  node: SidebarNode;
  depth: number;
}

function ExplorerSidebarNode({ node, depth }: ExplorerSidebarNodeProps) {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const params = useParams({ strict: false });
  const currentPath = normalizeExplorerPath(typeof params._splat === "string" ? params._splat : "");
  const { isManuallyExpanded, toggleExpandedPath } = useFileExplorerSidebarStore(useShallow((state) => ({
    isManuallyExpanded: !!state.expandedPaths[node.path],
    toggleExpandedPath: state.toggleExpandedPath,
  })));

  const isDirectory = node.type === "directory";
  const isActive = currentPath === node.path || currentPath.startsWith(`${node.path}/`);
  const isExpanded = isDirectory && (isActive || isManuallyExpanded);

  return (
    <div>
      <ExplorerTreeEntry
        name={node.name}
        isDirectory={isDirectory}
        isExpanded={isExpanded}
        active={isActive}
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
                  toggleExpandedPath(node.path);
                }}
              >
                {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </button>
            )
          : (
              <span className="inline-flex size-4 items-center justify-center">
                <ChevronRight className="size-3 opacity-0" />
              </span>
            )}
        trailing={node.badge ? <Badge variant="secondary" className="text-[10px]">{node.badge}</Badge> : undefined}
      />
      {isExpanded && <ExplorerSidebarNodeChildren directoryPath={node.path} depth={depth + 1} />}
    </div>
  );
}

function ExplorerSidebarNodeChildren({ directoryPath, depth }: { directoryPath: string; depth: number }) {
  const filters = useSearch({ strict: false }) as Partial<SearchQueryParams>;
  const childrenQuery = useQuery(directoryListingQueryOptions({
    path: directoryPath,
    ...filters,
  }));

  if (childrenQuery.isLoading) {
    return <ExplorerSidebarNodeChildren.Skeleton depth={depth} />;
  }

  if (!childrenQuery.data || childrenQuery.data.type !== "directory") {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        Failed
      </div>
    );
  }

  const childNodes = normalizeDirectoryEntries(childrenQuery.data.files);

  if (childNodes.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        No matches
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {childNodes.map((child) => (
        <ExplorerSidebarNode
          key={child.path}
          node={child}
          depth={depth}
        />
      ))}
    </div>
  );
}

ExplorerSidebarNodeChildren.Skeleton = ({ depth }: { depth: number }) => (
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

ExplorerSidebar.Skeleton = () => (
  <div className="flex h-full flex-col">
    <div className="px-3 py-3">
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex-1 space-y-1 px-2 pb-4">
      <ExplorerSidebarNodeChildren.Skeleton depth={0} />
    </div>
  </div>
);
