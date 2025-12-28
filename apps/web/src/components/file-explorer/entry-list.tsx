import type { FileFilter, ViewMode } from "@/types/file-explorer";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";
import { useMemo } from "react";
import { filesQueryOptions } from "@/functions/files";
import { ExplorerEntry } from "./explorer-entry";

export interface EntryListProps {
  currentPath: string;
  searchTerm: string;
  viewMode: ViewMode;
  filter: FileFilter;
}

export function EntryList({ currentPath, searchTerm, viewMode, filter }: EntryListProps) {
  const loaderData = useLoaderData({ from: "/file-explorer/$" });
  const { data } = useSuspenseQuery(filesQueryOptions({
    path: currentPath,
    order: loaderData.search?.order,
    pattern: loaderData.search?.pattern,
    sort: loaderData.search?.sort,
  }));

  const filteredEntries = useMemo(() => {
    let result = [...data.files];

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

    // Sort: directories first, then alphabetically
    result.sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [data.files, searchTerm, filter]);

  if (filteredEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          {searchTerm
            ? `No files matching "${searchTerm}"`
            : "This directory is empty"}
        </p>
      </div>
    );
  }

  return (
    <>
      {filteredEntries.map((entry) => (
        <ExplorerEntry
          key={entry.path}
          entry={entry}
          viewMode={viewMode}
          currentPath={currentPath}
        />
      ))}
    </>
  );
}
