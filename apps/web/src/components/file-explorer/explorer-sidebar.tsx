import type { FileEntry } from "@ucdjs/schemas";
import type { SearchQueryParams } from "../../lib/file-explorer";
import { filesQueryOptions } from "#functions/files";
import { versionsQueryOptions } from "#functions/versions";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Badge, Input, Skeleton } from "@ucdjs-internal/shared-ui/components";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { createContext, use, useState } from "react";
import { ExplorerTreeEntry } from "./explorer-entry";

const LEADING_SLASHES_RE = /^\/+/;
const TRAILING_SLASH_RE = /\/$/;
const TREE_INDENT = 14;
const TREE_PADDING = 8;

type LoadChildrenMode = "directory";

interface SidebarNode {
  name: string;
  path: string;
  type: "directory" | "file";
  badge?: string;
  children?: SidebarNode[];
  loadChildren?: LoadChildrenMode;
}

interface ExplorerSidebarContextValue {
  currentPath: string;
  filters: Partial<SearchQueryParams>;
}

const ExplorerSidebarContext = createContext<ExplorerSidebarContextValue | null>(null);

function useExplorerSidebar() {
  const ctx = use(ExplorerSidebarContext);
  if (!ctx) throw new Error("!Ctx");
  return ctx;
}

const normalize = (path: string) => path.replace(LEADING_SLASHES_RE, "").replace(TRAILING_SLASH_RE, "");
const getIndentStyle = (depth: number) => ({ marginLeft: depth * TREE_INDENT + TREE_PADDING });
const getRowIndentStyle = (depth: number) => ({ paddingLeft: depth * TREE_INDENT + TREE_PADDING });

function groupDirectoryEntries(entries: FileEntry[]) {
  return [
    ...entries.filter((entry) => entry.type === "directory"),
    ...entries.filter((entry) => entry.type !== "directory"),
  ];
}

function normalizeDirectoryEntries(entries: FileEntry[]): SidebarNode[] {
  return groupDirectoryEntries(entries).map((entry) => {
    const path = normalize(entry.path);

    return {
      type: entry.type,
      name: entry.name,
      path,
      loadChildren: entry.type === "directory" ? "directory" : undefined,
    } satisfies SidebarNode;
  });
}

export function ExplorerSidebar() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false }) as Partial<SearchQueryParams>;
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const { data: rootDirectory } = useSuspenseQuery(filesQueryOptions({
    path: "",
    statType: "directory",
    pattern: search.pattern,
    sort: search.sort,
    order: search.order,
    query: search.query,
    type: search.type,
  }));
  const currentPath = normalize(typeof params._splat === "string" ? params._splat : "");
  const [query, setQuery] = useState("");
  const versionTypes = new Map(versions.map((version) => [version.version, version.type] as const));

  const ctx: ExplorerSidebarContextValue = {
    currentPath,
    filters: search,
  };

  const rootNodes = rootDirectory.type === "directory"
    ? normalizeDirectoryEntries(rootDirectory.files).map((node) => ({
        ...node,
        badge: versionTypes.get(node.name),
      }))
    : [];
  const filteredRootNodes = query
    ? rootNodes.filter((node) => node.name.toLowerCase().includes(query.toLowerCase()))
    : rootNodes;

  return (
    <ExplorerSidebarContext value={ctx}>
      <div className="flex h-full flex-col">
        <div className="sticky top-0 z-10 bg-background px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter tree..."
              className="h-8 pl-8"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 pb-4">
          <div className="space-y-1">
            {filteredRootNodes.map((node) => (
              <Node
                key={node.path}
                node={node}
                depth={0}
              />
            ))}
          </div>
        </div>
      </div>
    </ExplorerSidebarContext>
  );
}

function Node({ node, depth }: { node: SidebarNode; depth: number }) {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const { currentPath } = useExplorerSidebar();

  const isDirectory = node.type === "directory";
  const isActive = currentPath === node.path || currentPath.startsWith(`${node.path}/`);
  const shouldAutoExpand = isDirectory && isActive;
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);
  const showChildren = isDirectory && isExpanded;

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
                  setIsExpanded(!isExpanded);
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
      {showChildren && <NodeChildren node={node} depth={depth + 1} />}
    </div>
  );
}

function NodeChildren({ node, depth }: { node: SidebarNode; depth: number }) {
  if (node.children) {
    if (node.children.length === 0) {
      return (
        <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
          No matches
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {node.children.map((child) => (
          <Node key={child.path} node={child} depth={depth} />
        ))}
      </div>
    );
  }

  if (!node.loadChildren) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        No matches
      </div>
    );
  }

  return <QueriedNodeChildren node={node} depth={depth} />;
}

function QueriedNodeChildren({ node, depth }: { node: SidebarNode; depth: number }) {
  const { filters } = useExplorerSidebar();
  const directoryQuery = useQuery({
    ...filesQueryOptions({
      path: node.path,
      statType: "directory",
      pattern: filters.pattern,
      sort: filters.sort,
      order: filters.order,
      query: filters.query,
      type: filters.type,
    }),
    enabled: true,
  });

  if (directoryQuery.isLoading) {
    return (
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
  }

  let entries: SidebarNode[] = [];

  if (!directoryQuery.data || directoryQuery.data.type !== "directory") {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        Failed
      </div>
    );
  }

  entries = normalizeDirectoryEntries(directoryQuery.data.files);

  if (entries.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground" style={getIndentStyle(depth)}>
        No matches
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((child) => (
        <Node key={child.path} node={child} depth={depth} />
      ))}
    </div>
  );
}

ExplorerSidebar.Skeleton = () => (
  <div className="flex h-full flex-col">
    <div className="px-3 py-3">
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex-1 space-y-1 px-2 pb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md py-1 pr-2 text-sm"
          style={getRowIndentStyle(0)}
        >
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      ))}
    </div>
  </div>
);
