import type { BackendEntry } from "./types";
import { appendTrailingSlash, prependLeadingSlash, trimTrailingSlash } from "@luxass/utils/path";
import { BackendEntryIsDirectory } from "./errors";

const BACKSLASH_RE = /\\/g;

export function normalizePathSeparators(path: string): string {
  return path.replace(BACKSLASH_RE, "/");
}

export function isDirectoryPath(path: string): boolean {
  const trimmedPath = path.trim();

  return trimmedPath === "/"
    || trimmedPath === "."
    || trimmedPath === "./"
    || trimmedPath === ".."
    || trimmedPath === "../"
    || trimmedPath.endsWith("/");
}

export function assertFilePath(path: string): void {
  if (isDirectoryPath(path)) {
    throw new BackendEntryIsDirectory(path);
  }
}

export function normalizeEntryPath(
  path: string,
  type: BackendEntry["type"],
): string {
  const normalizedPath = normalizePathSeparators(path);
  const withLeadingSlash = prependLeadingSlash(trimTrailingSlash(normalizedPath));

  if (type === "directory") {
    return withLeadingSlash === "/" ? "/" : appendTrailingSlash(withLeadingSlash);
  }

  return withLeadingSlash;
}

export function sortEntries(entries: BackendEntry[]): BackendEntry[] {
  const sortedEntries = entries.toSorted((left, right) => left.path.localeCompare(right.path));

  return sortedEntries.map((entry) =>
    entry.type === "directory"
      ? {
          ...entry,
          children: sortEntries(entry.children),
        }
      : entry);
}
