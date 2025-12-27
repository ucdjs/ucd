import type { FileEntry } from "@ucdjs/schemas";
import { Link } from "@tanstack/react-router";
import { FolderIcon, FolderOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

function formatExactDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function DirectoryItem({ directory, viewMode, currentPath }: DirectoryItemProps) {
  const dirPath = currentPath ? `${currentPath}/${directory.name}` : directory.name;
  const lastModified = directory.lastModified
    ? formatRelativeTime(directory.lastModified)
    : null;

  if (viewMode === "cards") {
    return (
      <Link
        to="/explorer/files/$"
        params={{ _splat: dirPath }}
        className="block group"
      >
        <Card size="sm" className="hover:ring-2 hover:ring-primary/30 hover:bg-accent/50 transition-all cursor-pointer">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FolderIcon className="size-4 text-amber-500 group-hover:hidden shrink-0" />
              <FolderOpen className="size-4 text-amber-500 hidden group-hover:block shrink-0" />
              <span
                className="truncate font-medium text-sm group-hover:text-primary transition-colors"
                title={directory.name}
              >
                {directory.name}
              </span>
            </div>
            {lastModified && (
              <span className="text-xs text-muted-foreground" title={formatExactDate(directory.lastModified!)}>
                {lastModified}
              </span>
            )}
          </CardContent>
        </Card>
      </Link>
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
        <Tooltip>
          <TooltipTrigger render={() => (
            <span className="text-xs text-muted-foreground shrink-0 cursor-help">
              {lastModified}
            </span>
          )}
          />
          <TooltipContent>
            {formatExactDate(directory.lastModified!)}
          </TooltipContent>
        </Tooltip>
      )}
    </Link>
  );
}
