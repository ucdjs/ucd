import type { UnicodeFileTreeNode } from "@ucdjs/schemas";
import { versionFileTreeQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMatches, useNavigate, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { ExplorerTreeEntry } from "./explorer-entry";
import { FileTreeList } from "./file-tree-list";

type ExpandedState = Set<string>;

function normalizeTreePath(path: string) {
  return path.replace(/^\/+/, "");
}

function flattenNodes(
  nodes: UnicodeFileTreeNode[],
  current: UnicodeFileTreeNode[] = [],
) {
  nodes.forEach((node) => {
    current.push(node);
    if (node.type === "directory" && node.children?.length) {
      flattenNodes(node.children, current);
    }
  });
  return current;
}

// Used to auto-expand the tree to the current route.
function collectAncestorPaths(path: string, isFile: boolean) {
  if (!path) return [];
  const normalized = normalizeTreePath(path);
  const parts = normalized.split("/").filter(Boolean);
  if (isFile && parts.length) {
    parts.pop();
  }
  const ancestors: string[] = [];
  let current = "";
  parts.forEach((part) => {
    current += `${part}/`;
    ancestors.push(current);
  });
  return ancestors;
}

// Tree nodes from the API are version-relative; normalize them to version-prefixed paths.
function prefixTreeWithVersion(nodes: UnicodeFileTreeNode[], version: string): UnicodeFileTreeNode[] {
  return nodes.map((node) => {
    const normalizedPath = normalizeTreePath(node.path);
    const versionPrefix = `${version}/`;
    const resolvedPath = normalizedPath.startsWith(versionPrefix)
      ? normalizedPath
      : `${versionPrefix}${normalizedPath}`;

    if (node.type === "directory") {
      return {
        ...node,
        path: resolvedPath,
        children: prefixTreeWithVersion(node.children, version),
      };
    }

    return {
      ...node,
      path: resolvedPath,
    };
  });
}

export function FileTree() {
  const params = useParams({ strict: false });
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const isFileView = lastMatch?.routeId === "/(explorer)/file-explorer/v/$";
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const pathParam = typeof params._splat === "string" ? params._splat : "";
  const currentPath = pathParam || "";

  const [expanded, setExpanded] = useState<ExpandedState>(() => new Set());
  const [query, setQuery] = useState("");
  const lastAutoExpandedPath = useRef<string | null>(null);

  const normalizedCurrentPath = normalizeTreePath(
    !isFileView && currentPath && !currentPath.endsWith("/")
      ? `${currentPath}/`
      : currentPath,
  );
  const isFiltered = query.trim().length > 0;
  const ancestorPaths = collectAncestorPaths(normalizedCurrentPath, isFileView);

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Auto-expand when the route changes so the active item is visible.
  useEffect(() => {
    if (lastAutoExpandedPath.current === normalizedCurrentPath) return;
    lastAutoExpandedPath.current = normalizedCurrentPath;
    if (!ancestorPaths.length) return;
    const missing = ancestorPaths.filter((path) => !expanded.has(path));
    if (!missing.length) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      missing.forEach((path) => next.add(path));
      return next;
    });
  }, [ancestorPaths, expanded, normalizedCurrentPath]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-2 sticky top-0 bg-background z-10">
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
          {(query.trim()
            ? versions.filter((version) => version.version.toLowerCase().includes(query.trim().toLowerCase()))
            : versions
          ).map((version) => {
            const versionPath = `${version.version}/`;
            const isActive = normalizedCurrentPath.startsWith(versionPath);
            const isExpanded = expanded.has(versionPath) || isActive;

            return (
              <div key={version.version}>
                <ExplorerTreeEntry
                  name={`v${version.version}`}
                  isDirectory
                  isExpanded={isExpanded}
                  active={isActive}
                  onSelect={() => navigate({
                    to: "/file-explorer/$",
                    params: { _splat: `${version.version}/` },
                  })}
                  leading={(
                    <button
                      type="button"
                      className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggle(versionPath);
                      }}
                    >
                      {isExpanded
                        ? <ChevronDown className="size-3" />
                        : <ChevronRight className="size-3" />}
                    </button>
                  )}
                  trailing={(
                    <Badge variant="secondary" className="text-[10px]">
                      {version.type}
                    </Badge>
                  )}
                />
                {isExpanded && (
                  <Suspense fallback={<VersionTreeSkeleton depth={1} />}>
                    <VersionTree
                      version={version.version}
                      query={query}
                      depth={1}
                      expanded={expanded}
                      onToggle={handleToggle}
                      currentPath={normalizedCurrentPath}
                      isFiltered={isFiltered}
                    />
                  </Suspense>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VersionTree({
  version,
  query,
  depth,
  expanded,
  onToggle,
  currentPath,
  isFiltered,
}: {
  version: string;
  query: string;
  depth: number;
  expanded: ExpandedState;
  onToggle: (path: string) => void;
  currentPath: string;
  isFiltered: boolean;
}) {
  const { data: fileTree } = useSuspenseQuery(versionFileTreeQueryOptions(version));
  const normalizedQuery = query.trim().toLowerCase();

  const normalizedNodes = prefixTreeWithVersion(fileTree, version);
  const orderedNodes = [
    ...normalizedNodes.filter((node) => node.type === "directory"),
    ...normalizedNodes.filter((node) => node.type !== "directory"),
  ];
  const filteredNodes = isFiltered
    ? flattenNodes(orderedNodes).filter((node) => node.name.toLowerCase().includes(normalizedQuery))
    : orderedNodes;
  const nodes = isFiltered
    ? [
        ...filteredNodes.filter((node) => node.type === "directory"),
        ...filteredNodes.filter((node) => node.type !== "directory"),
      ]
    : orderedNodes;
  if (nodes.length === 0) {
    return (
      <div
        className="rounded-md border border-dashed p-4 text-xs text-muted-foreground"
        style={{ marginLeft: depth * 14 + 8 }}
      >
        No matching files in this tree.
      </div>
    );
  }

  return (
    <div>
      <FileTreeList
        nodes={nodes}
        depth={depth}
        expanded={expanded}
        onToggle={onToggle}
        currentPath={currentPath}
        isFiltered={isFiltered}
      />
    </div>
  );
}

function VersionTreeSkeleton({ depth }: { depth: number }) {
  const skeletonRows = ["tree-row-1", "tree-row-2", "tree-row-3"];
  return (
    <div className="space-y-2" style={{ marginLeft: depth * 14 + 8 }}>
      {skeletonRows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      ))}
    </div>
  );
}

export function FileTreeSkeleton() {
  const skeletonKeys = [
    "tree-skeleton-1",
    "tree-skeleton-2",
    "tree-skeleton-3",
    "tree-skeleton-4",
    "tree-skeleton-5",
    "tree-skeleton-6",
    "tree-skeleton-7",
    "tree-skeleton-8",
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-3">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="px-3 py-2">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
      <div className="flex-1 space-y-2 px-3 pb-4">
        {skeletonKeys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
