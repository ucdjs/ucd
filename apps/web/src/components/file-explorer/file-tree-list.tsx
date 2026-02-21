import type { UnicodeFileTreeNode } from "@ucdjs/schemas";
import { ExplorerTreeEntry } from "#components/file-explorer/explorer-entry";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";

function normalizeTreePath(path: string) {
  return path.replace(/^\/+/, "");
}

interface FileTreeListProps {
  nodes: UnicodeFileTreeNode[];
  expanded: Set<string>;
  onToggle: (path: string) => void;
  currentPath: string;
  isFiltered: boolean;
  depth?: number;
}

export function FileTreeList({
  nodes,
  expanded,
  onToggle,
  currentPath,
  isFiltered,
  depth = 0,
}: FileTreeListProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          expanded={expanded}
          onToggle={onToggle}
          currentPath={currentPath}
          isFiltered={isFiltered}
          depth={isFiltered ? 0 : depth}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: UnicodeFileTreeNode;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  currentPath: string;
  isFiltered: boolean;
  depth: number;
}

// Chevron toggles only; row click navigates.
function FileTreeNode({
  node,
  expanded,
  onToggle,
  currentPath,
  isFiltered,
  depth,
}: FileTreeNodeProps) {
  const navigate = useNavigate({ from: "/file-explorer/$" });
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
  const handleSelect = () => navigate({
    to: isDirectory ? "/file-explorer/$" : "/file-explorer/v/$",
    params: { _splat: normalizedPath },
  });

  return (
    <div>
      <ExplorerTreeEntry
        name={node.name}
        isDirectory={isDirectory}
        isExpanded={isExpanded}
        active={isActive}
        indent={depth * 14 + 8}
        onSelect={handleSelect}
        leading={isDirectory
          ? (
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(normalizedPath);
                }}
              >
                {isExpanded
                  ? <ChevronDown className="size-3" />
                  : <ChevronRight className="size-3" />}
              </button>
            )
          : (
              <span className="inline-flex size-4 items-center justify-center text-muted-foreground">
                <ChevronRight className="size-3 opacity-0" />
              </span>
            )}
      />
      {shouldShowChildren && children?.length
        ? (
            <FileTreeList
              nodes={children}
              expanded={expanded}
              onToggle={onToggle}
              currentPath={currentPath}
              isFiltered={isFiltered}
              depth={depth + 1}
            />
          )
        : null}
    </div>
  );
}
