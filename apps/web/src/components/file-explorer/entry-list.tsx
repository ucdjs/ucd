import type { ViewMode } from "#types/file-explorer";
import type { FileEntry } from "@ucdjs/schemas";
import { filesQueryOptions } from "#functions/files";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { ExplorerEntry } from "./explorer-entry";

export interface EntryListProps {
  currentPath: string;
  viewMode: ViewMode;
}

export function EntryList({ currentPath, viewMode }: EntryListProps) {
  const search = useSearch({ from: "/(explorer)/file-explorer/$" });
  const { data } = useSuspenseQuery(filesQueryOptions({
    path: currentPath,
    order: search.order,
    pattern: search.pattern,
    sort: search.sort,
    query: search.query,
    type: search.type,
  }));

  if ((data.files || []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          {search.query
            ? `No files matching "${search.query}"`
            : "This directory is empty"}
        </p>
      </div>
    );
  }

  return (
    <>
      {(data.files || []).map((entry: FileEntry) => (
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
