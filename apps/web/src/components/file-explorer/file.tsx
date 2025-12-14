import type { FileEntry } from "@ucdjs/schemas";
import { Link } from "@tanstack/react-router";
import { FileIcon, FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FileItemProps {
  file: FileEntry;
  viewMode: "list" | "cards";
  currentPath: string;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "txt":
    case "md":
      return <FileText className="size-4 text-blue-500" />;
    default:
      return <FileIcon className="size-4 text-muted-foreground" />;
  }
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

export function FileItem({ file, viewMode, currentPath }: FileItemProps) {
  const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
  const lastModified = file.lastModified
    ? formatRelativeTime(file.lastModified)
    : null;

  if (viewMode === "cards") {
    return (
      <Card size="sm" className="hover:ring-primary/30 transition-all hover:ring-2">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {getFileIcon(file.name)}
            <Link
              to="/explorer/files/$"
              params={{ _splat: filePath }}
              className="truncate font-medium text-sm hover:text-primary transition-colors"
              title={file.name}
            >
              {file.name}
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
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md",
        "hover:bg-muted/50 transition-colors",
        "border-b border-border/50 last:border-b-0",
      )}
    >
      {getFileIcon(file.name)}
      <Link
        to="/explorer/files/$"
        params={{ _splat: filePath }}
        className="flex-1 truncate text-sm hover:text-primary transition-colors"
        title={file.name}
      >
        {file.name}
      </Link>
      {lastModified && (
        <span className="text-xs text-muted-foreground shrink-0">
          {lastModified}
        </span>
      )}
    </div>
  );
}
