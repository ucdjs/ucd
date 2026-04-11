import type { FileEntry, UnicodeVersionList } from "@ucdjs/schemas";
import type { SearchQueryParams } from "./file-explorer";
import { filesQueryOptions } from "#functions/files";

const LEADING_SLASHES_RE = /^\/+/;
const TRAILING_SLASH_RE = /\/$/;

export const TREE_INDENT = 14;
export const TREE_PADDING = 8;

export interface SidebarNode {
  name: string;
  path: string;
  type: "directory" | "file";
  badge?: string;
}

export function normalizeExplorerPath(path: string) {
  return path.replace(LEADING_SLASHES_RE, "").replace(TRAILING_SLASH_RE, "");
}

export function getIndentStyle(depth: number) {
  return { marginLeft: depth * TREE_INDENT + TREE_PADDING };
}

export function getRowIndentStyle(depth: number) {
  return { paddingLeft: depth * TREE_INDENT + TREE_PADDING };
}

function groupDirectoryEntries(entries: FileEntry[]) {
  return [
    ...entries.filter((entry) => entry.type === "directory"),
    ...entries.filter((entry) => entry.type !== "directory"),
  ];
}

export function normalizeDirectoryEntries(entries: FileEntry[]): SidebarNode[] {
  return groupDirectoryEntries(entries).map((entry) => ({
    type: entry.type,
    name: entry.name,
    path: normalizeExplorerPath(entry.path),
  }));
}

export function getDirectoryListingQueryOptions(path: string, filters: Partial<SearchQueryParams>) {
  return filesQueryOptions({
    path,
    statType: "directory",
    pattern: filters.pattern,
    sort: filters.sort,
    order: filters.order,
    query: filters.query,
    type: filters.type,
  });
}

export function getVersionBadge(versionType?: string) {
  return versionType === "draft" ? "draft" : undefined;
}

export function buildRootSidebarNodes(entries: FileEntry[], versions: UnicodeVersionList): SidebarNode[] {
  const versionTypes = new Map(versions.map((version) => [version.version, version.type] as const));

  return normalizeDirectoryEntries(entries).map((node) => ({
    ...node,
    badge: getVersionBadge(versionTypes.get(node.name)),
  }));
}

export function filterSidebarNodes(nodes: SidebarNode[], filterText: string) {
  if (!filterText) {
    return nodes;
  }

  const normalizedFilter = filterText.toLowerCase();
  return nodes.filter((node) => node.name.toLowerCase().includes(normalizedFilter));
}
