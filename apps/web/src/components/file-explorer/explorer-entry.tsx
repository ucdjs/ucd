import type { FileEntry } from "@ucdjs/schemas";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui";
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

interface BaseEntryContentProps {
  name: string;
  isDirectory: boolean;
  isExpanded?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  meta?: string | null;
  labelClassName?: string;
}

function BaseEntryContent({
  name,
  isDirectory,
  isExpanded,
  leading,
  trailing,
  meta,
  labelClassName,
}: BaseEntryContentProps) {
  const icon = isDirectory
    ? (
        isExpanded
          ? <FolderOpen className="size-4 text-amber-500 shrink-0" />
          : <FolderIcon className="size-4 text-amber-500 shrink-0" />
      )
    : <FileIcon className="size-4 text-blue-500 shrink-0" />;

  return (
    <>
      {leading}
      {icon}
      <span className={cn("flex-1 truncate", labelClassName)} title={name}>
        {name}
      </span>
      {meta && (
        <span className="text-xs text-muted-foreground shrink-0">
          {meta}
        </span>
      )}
      {trailing}
    </>
  );
}

export interface ExplorerTreeEntryProps {
  name: string;
  onSelect?: () => void;
  isDirectory: boolean;
  isExpanded?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  indent?: number;
  className?: string;
}

export function ExplorerTreeEntry({
  name,
  onSelect,
  isDirectory,
  isExpanded,
  leading,
  trailing,
  active,
  indent,
  className,
}: ExplorerTreeEntryProps) {
  const interactiveProps = onSelect
    ? {
        role: "button",
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        },
      }
    : undefined;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md pr-2 py-1 text-sm",
        active && "bg-primary/10 text-primary",
        !active && "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        onSelect && "cursor-pointer",
        className,
      )}
      style={indent ? { paddingLeft: indent } : undefined}
      {...interactiveProps}
    >
      <BaseEntryContent
        name={name}
        isDirectory={isDirectory}
        isExpanded={isExpanded}
        leading={leading}
        trailing={trailing}
      />
    </div>
  );
}

export interface ExplorerEntryProps {
  entry: FileEntry;
  currentPath: string;
}

export function ExplorerEntry({ entry, currentPath }: ExplorerEntryProps) {
  const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
  const lastModified = entry.lastModified
    ? formatRelativeTime(entry.lastModified)
    : null;

  const isDirectory = entry.type === "directory";
  const linkProps = isDirectory
    ? { to: "/file-explorer/$" as const, params: { _splat: entryPath } }
    : { to: "/file-explorer/v/$" as const, params: { _splat: entryPath } };

  return (
    <Link
      {...linkProps}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md group",
        "hover:bg-muted/50 transition-colors",
        "border-b border-border/50 last:border-b-0",
      )}
    >
      <BaseEntryContent
        name={entry.name}
        isDirectory={isDirectory}
        meta={lastModified}
        labelClassName="text-sm group-hover:text-primary transition-colors"
      />
    </Link>
  );
}
