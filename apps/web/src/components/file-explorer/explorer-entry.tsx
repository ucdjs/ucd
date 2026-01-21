import type { ViewMode } from "#types/file-explorer";
import type { FileEntry } from "@ucdjs/schemas";
import { cn } from "#lib/utils";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/components";
import { FileIcon, FolderIcon, FolderOpen } from "lucide-react";

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

export interface ExplorerEntryProps {
  entry: FileEntry;
  viewMode: ViewMode;
  currentPath: string;
}

export function ExplorerEntry({ entry, viewMode, currentPath }: ExplorerEntryProps) {
  const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
  const lastModified = entry.lastModified
    ? formatRelativeTime(entry.lastModified)
    : null;

  const isDirectory = entry.type === "directory";
  const linkProps = isDirectory
    ? { to: "/file-explorer/$" as const, params: { _splat: entryPath } }
    : { to: "/file-explorer/v/$" as const, params: { _splat: entryPath } };

  if (viewMode === "cards") {
    return (
      <Card size="sm" className="hover:ring-primary/30 transition-all hover:ring-2 group">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {isDirectory
              ? (
                  <>
                    <FolderIcon className="size-4 text-amber-500 group-hover:hidden" />
                    <FolderOpen className="size-4 text-amber-500 hidden group-hover:block" />
                  </>
                )
              : (
                  <FileIcon className="size-4 text-blue-500" />
                )}
            <Link
              {...linkProps}
              className="truncate font-medium text-sm hover:text-primary transition-colors"
              title={entry.name}
            >
              {entry.name}
            </Link>
          </div>
          {lastModified && (
            <p className="text-xs text-muted-foreground">{lastModified}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      {...linkProps}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md group",
        "hover:bg-muted/50 transition-colors",
        "border-b border-border/50 last:border-b-0",
      )}
    >
      {isDirectory
        ? (
            <>
              <FolderIcon className="size-4 text-amber-500 group-hover:hidden shrink-0" />
              <FolderOpen className="size-4 text-amber-500 hidden group-hover:block shrink-0" />
            </>
          )
        : (
            <FileIcon className="size-4 text-blue-500 shrink-0" />
          )}
      <span
        className="flex-1 truncate text-sm hover:text-primary transition-colors"
        title={entry.name}
      >
        {entry.name}
      </span>
      {lastModified && (
        <span className="text-xs text-muted-foreground shrink-0">
          {lastModified}
        </span>
      )}
    </Link>
  );
}
