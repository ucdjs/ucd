import { filesQueryOptions } from "#functions/files";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { FolderOpen } from "lucide-react";
import { ExplorerEntry } from "./explorer-entry";

export interface EntryListProps {
  currentPath: string;
}

export function EntryList({ currentPath }: EntryListProps) {
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
      {sortedEntries.map((entry) => (
        <ExplorerEntry
          key={entry.path}
          entry={entry}
          currentPath={currentPath}
        />
      ))}
    </>
  );
}

EntryList.Skeleton = function EntryListSkeleton({
  amount,
}: {
  amount: { total: number; files: number; directories: number };
}) {
  const skeletons = Array.from({ length: amount.total || 5 });

  return (
    <>
      {skeletons.map((_, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`skeleton-list-${i}`}
          className={cn(
            "flex items-center gap-3 px-3 py-2",
            "border-b border-border/50 last:border-b-0",
          )}
        >
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </>
  );
};
