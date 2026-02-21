import type { ViewMode } from "#types/file-explorer";
import type { FileEntry } from "@ucdjs/schemas";
import { filesQueryOptions } from "#functions/files";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { FolderOpen } from "lucide-react";
import { ExplorerEntry } from "./explorer-entry";

export interface EntryListProps {
  currentPath: string;
  viewMode: ViewMode;
}

export function EntryList({ currentPath, viewMode }: EntryListProps) {
  const search = useSearch({ from: "/(explorer)/file-explorer/$" });
  const navigate = useNavigate({ from: "/file-explorer/$" });
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
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <FolderOpen className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {search.query ? "No matches" : "Nothing here yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {search.query
              ? `No files matching "${search.query}"`
              : "This directory does not contain any files."}
          </p>
        </div>
        {search.query && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({
              search: (prev) => ({
                ...prev,
                query: undefined,
              }),
            })}
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  const entries = data.files || [];
  const sortedEntries = [
    ...entries.filter((entry) => entry.type === "directory"),
    ...entries.filter((entry) => entry.type !== "directory"),
  ];

  return (
    <>
      {sortedEntries.map((entry: FileEntry) => (
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
