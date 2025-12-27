import type { FileEntry } from "@ucdjs/schemas";
import type { FileFilter, ViewMode } from "./explorer-toolbar";
import { useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { DirectoryItem } from "./directory";
import { ExplorerToolbar } from "./explorer-toolbar";
import { FileItem } from "./file";
import { ParentDirectory } from "./parent-directory";

export interface FileExplorerProps {
  files: FileEntry[];
  currentPath: string;
  isLoading?: boolean;
}

export function FileExplorer({ files, currentPath, isLoading }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FileFilter>({
    type: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Extract available file extensions
  const availableExtensions = useMemo(() => {
    const extensions = new Set<string>();
    files.forEach((file) => {
      if (file.type === "file") {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && ext !== file.name) {
          extensions.add(ext);
        }
      }
    });
    return Array.from(extensions).sort();
  }, [files]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((file) =>
        file.name.toLowerCase().includes(lowerSearch),
      );
    }

    // Apply type filter
    if (filter.type === "files") {
      result = result.filter((file) => file.type === "file");
    } else if (filter.type === "directories") {
      result = result.filter((file) => file.type === "directory");
    }

    // Apply extension filter
    if (filter.extension) {
      result = result.filter((file) => {
        if (file.type === "directory") return true;
        const ext = file.name.split(".").pop()?.toLowerCase();
        return ext === filter.extension;
      });
    }

    // Sort files
    const sortBy = filter.sortBy || "name";
    const sortOrder = filter.sortOrder || "asc";

    result.sort((a, b) => {
      // Always keep directories first unless sorting by type
      if (sortBy !== "type") {
        if (a.type === "directory" && b.type !== "directory") return -1;
        if (a.type !== "directory" && b.type === "directory") return 1;
      }

      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = (a.lastModified || 0) - (b.lastModified || 0);
          break;
        case "type":
          if (a.type === b.type) {
            comparison = a.name.localeCompare(b.name);
          } else {
            comparison = a.type.localeCompare(b.type);
          }
          break;
        case "name":
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [files, searchTerm, filter]);

  const directories = filteredFiles.filter((f) => f.type === "directory");
  const fileItems = filteredFiles.filter((f) => f.type === "file");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 flex-1 max-w-md" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ExplorerToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        availableExtensions={availableExtensions}
      />

      {filteredFiles.length === 0
        ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? `No files matching "${searchTerm}"`
                  : "This directory is empty"}
              </p>
            </div>
          )
        : (
            <div
              className={cn(
                viewMode === "cards"
                  ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col rounded-lg border border-border overflow-hidden",
              )}
            >
              <ParentDirectory currentPath={currentPath} viewMode={viewMode} />
              {directories.map((dir) => (
                <DirectoryItem
                  key={dir.path}
                  directory={dir}
                  viewMode={viewMode}
                  currentPath={currentPath}
                />
              ))}
              {fileItems.map((file) => (
                <FileItem
                  key={file.path}
                  file={file}
                  viewMode={viewMode}
                  currentPath={currentPath}
                />
              ))}
            </div>
          )}

      {/* Stats footer */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
        {directories.length}
        {" "}
        {directories.length === 1 ? "directory" : "directories"}
        ,
        {" "}
        {fileItems.length}
        {" "}
        {fileItems.length === 1 ? "file" : "files"}
        {searchTerm && ` (filtered from ${files.length} total)`}
      </div>
    </div>
  );
}
