import type { UnicodeFileTreeNode } from "@ucdjs/schemas";
import { versionFileTreeQueryOptions, versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useMatches, useNavigate, useParams } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  FileIcon,
  FolderIcon,
  FolderOpen,
  Layers,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ExpandedState = Set<string>;

interface FileTreeProps {
  expanded: ExpandedState;
  onToggle: (path: string) => void;
  onExpandPaths: (paths: string[]) => void;
}

const TOP_LEVEL_LIMIT = 200;

function normalizeTreePath(path: string) {
  return path.replace(/^\/+/, "");
}

function flattenNodes(nodes: UnicodeFileTreeNode[], current: UnicodeFileTreeNode[] = []) {
  nodes.forEach((node) => {
    current.push(node);
    if (node.type === "directory" && node.children?.length) {
      flattenNodes(node.children, current);
    }
  });
  return current;
}

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

export function FileTree({ expanded, onToggle, onExpandPaths }: FileTreeProps) {
  const params = useParams({ strict: false });
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const isFileView = lastMatch?.routeId === "/(explorer)/file-explorer/v/$";
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const pathParam = typeof params._splat === "string" ? params._splat : "";
  const pathVersion = pathParam.split("/").filter(Boolean)[0];
  const currentVersion = pathVersion
    || versions.find((v) => v.type === "stable")?.version
    || versions[0]?.version
    || "";
  const currentPath = pathParam || "";

  const { data: fileTree } = useSuspenseQuery(versionFileTreeQueryOptions(currentVersion));
  const [query, setQuery] = useState("");
  const [showAllTopLevel, setShowAllTopLevel] = useState(false);

  const normalizedCurrentPath = normalizeTreePath(
    !isFileView && currentPath && !currentPath.endsWith("/")
      ? `${currentPath}/`
      : currentPath,
  );
  const isFiltered = !!query.trim();
  const nodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const ordered = [
      ...fileTree.filter((node) => node.type === "directory"),
      ...fileTree.filter((node) => node.type !== "directory"),
    ];

    if (!normalizedQuery) {
      return ordered;
    }

    const filtered = flattenNodes(ordered).filter((node) => node.name.toLowerCase().includes(normalizedQuery));
    return [
      ...filtered.filter((node) => node.type === "directory"),
      ...filtered.filter((node) => node.type !== "directory"),
    ];
  }, [fileTree, query]);

  const topLevelNodes = useMemo(() => {
    if (isFiltered) return nodes;
    if (showAllTopLevel) return nodes;
    return nodes.slice(0, TOP_LEVEL_LIMIT);
  }, [nodes, isFiltered, showAllTopLevel]);

  const ancestorPaths = useMemo(
    () => collectAncestorPaths(normalizedCurrentPath, isFileView),
    [normalizedCurrentPath, isFileView],
  );

  useEffect(() => {
    if (!ancestorPaths.length) return;
    const missing = ancestorPaths.filter((path) => !expanded.has(path));
    if (!missing.length) return;
    onExpandPaths(missing);
  }, [ancestorPaths, expanded, onExpandPaths]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-12 items-center gap-2 border-b px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(triggerProps) => (
              <Button
                {...triggerProps}
                variant="outline"
                size="sm"
                className="h-8 flex-1 justify-between"
              >
                <span className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">
                    Unicode
                    {" "}
                    {currentVersion}
                  </span>
                </span>
                <ChevronDown className="size-4" />
              </Button>
            )}
          />
          <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
            {versions.map((version) => (
              <DropdownMenuItem
                key={version.version}
                onSelect={(event) => {
                  event.preventDefault();
                  const nextPath = currentPath
                    ? [version.version, ...currentPath.split("/").filter(Boolean).slice(1)].join("/")
                    : `${version.version}/`;
                  navigate({
                    to: isFileView ? "/file-explorer/v/$" : "/file-explorer/$",
                    params: { _splat: nextPath },
                  });
                }}
              >
                <span className="flex-1">
                  v
                  {version.version}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {version.type}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 py-2">
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
        {topLevelNodes.length === 0
          ? (
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                No matching files in this tree.
              </div>
            )
          : (
              <FileTreeList
                nodes={topLevelNodes}
                expanded={expanded}
                onToggle={onToggle}
                currentPath={normalizedCurrentPath}
                query={query}
                isFiltered={isFiltered}
              />
            )}

        {!isFiltered && nodes.length > TOP_LEVEL_LIMIT && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-center text-xs"
            onClick={() => setShowAllTopLevel((prev) => !prev)}
          >
            {showAllTopLevel ? "Show fewer" : `Show ${nodes.length - TOP_LEVEL_LIMIT} more`}
          </Button>
        )}
      </div>
    </div>
  );
}

function FileTreeList({
  nodes,
  expanded,
  onToggle,
  currentPath,
  query,
  isFiltered,
  depth = 0,
}: {
  nodes: UnicodeFileTreeNode[];
  expanded: ExpandedState;
  onToggle: (path: string) => void;
  currentPath: string;
  query: string;
  isFiltered: boolean;
  depth?: number;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          expanded={expanded}
          onToggle={onToggle}
          currentPath={currentPath}
          query={query}
          isFiltered={isFiltered}
          depth={isFiltered ? 0 : depth}
        />
      ))}
    </div>
  );
}

function FileTreeNode({
  node,
  expanded,
  onToggle,
  currentPath,
  query,
  isFiltered,
  depth,
}: {
  node: UnicodeFileTreeNode;
  expanded: ExpandedState;
  onToggle: (path: string) => void;
  currentPath: string;
  query: string;
  isFiltered: boolean;
  depth: number;
}) {
  const normalizedPath = normalizeTreePath(node.path);
  const isDirectory = node.type === "directory";
  const isExpanded = expanded.has(normalizedPath);
  const isActive = currentPath === normalizedPath
    || (isDirectory && currentPath.startsWith(normalizedPath));
  const shouldShowChildren = isDirectory && !isFiltered && isExpanded;
  const children = node.type === "directory"
    ? [
        ...node.children.filter((child: UnicodeFileTreeNode) => child.type === "directory"),
        ...node.children.filter((child: UnicodeFileTreeNode) => child.type !== "directory"),
      ]
    : undefined;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-1 text-xs",
          isActive && "bg-primary/10 text-primary",
          !isActive && "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        )}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        {isDirectory
          ? (
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-sm hover:bg-muted"
                onClick={() => onToggle(normalizedPath)}
              >
                {isExpanded
                  ? <ChevronDown className="size-3" />
                  : <ChevronRight className="size-3" />}
              </button>
            )
          : (
              <span className="inline-flex size-4 items-center justify-center">
                <FileIcon className="size-3" />
              </span>
            )}
        {isDirectory
          ? (
              isExpanded
                ? <FolderOpen className="size-3.5" />
                : <FolderIcon className="size-3.5" />
            )
          : null}
        <Link
          to={isDirectory ? "/file-explorer/$" : "/file-explorer/v/$"}
          params={{ _splat: normalizedPath }}
          className="flex-1 truncate"
          title={node.name}
        >
          {node.name}
        </Link>
      </div>
      {shouldShowChildren && children?.length
        ? (
            <FileTreeList
              nodes={children}
              expanded={expanded}
              onToggle={onToggle}
              currentPath={currentPath}
              query={query}
              isFiltered={isFiltered}
              depth={depth + 1}
            />
          )
        : null}
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
