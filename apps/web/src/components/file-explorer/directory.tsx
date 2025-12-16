import type { FileEntry } from "@ucdjs/schemas";
import { Link } from "@tanstack/react-router";
import { FolderIcon, FolderOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DirectoryItemProps {
  directory: FileEntry;
  viewMode: "list" | "cards";
  currentPath: string;
}

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

export function DirectoryItem({ directory, viewMode, currentPath }: DirectoryItemProps) {
  const dirPath = currentPath ? `${currentPath}/${directory.name}` : directory.name;
  const lastModified = directory.lastModified
    ? formatRelativeTime(directory.lastModified)
    : null;

  if (viewMode === "cards") {
    return (
      <Card size="sm" className="hover:ring-primary/30 transition-all hover:ring-2 group">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FolderIcon className="size-4 text-amber-500 group-hover:hidden" />
            <FolderOpen className="size-4 text-amber-500 hidden group-hover:block" />
            <Link
              to="/explorer/files/$"
              params={{ _splat: dirPath }}
              className="truncate font-medium text-sm hover:text-primary transition-colors"
              title={directory.name}
            >
              {directory.name}
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
      to="/explorer/files/$"
      params={{ _splat: dirPath }}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md group",
        "hover:bg-muted/50 transition-colors",
        "border-b border-border/50 last:border-b-0",
      )}
    >
      <FolderIcon className="size-4 text-amber-500 group-hover:hidden shrink-0" />
      <FolderOpen className="size-4 text-amber-500 hidden group-hover:block shrink-0" />
      <span
        className="flex-1 truncate text-sm hover:text-primary transition-colors"
        title={directory.name}
      >
        {directory.name}
      </span>
      {lastModified && (
        <span className="text-xs text-muted-foreground shrink-0">
          {lastModified}
        </span>
      )}
    </Link>
  );
}
