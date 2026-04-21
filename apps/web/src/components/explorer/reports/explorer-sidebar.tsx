import { reportsQueryOptions } from "#functions/reports";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui";
import { Input, Skeleton } from "@ucdjs-internal/shared-ui/components";
import { FileText, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

export function ReportsExplorerSidebar() {
  const { data: reports } = useSuspenseQuery(reportsQueryOptions());
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false }) as { view?: "render" | "code" | "split" };
  const currentReportId = typeof params.id === "string" ? params.id : "";
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredReports = useMemo(() => {
    if (!deferredQuery) {
      return reports;
    }

    return reports.filter((report) => {
      const haystack = `${report.id} ${report.title ?? ""}`.toLowerCase();
      return haystack.includes(deferredQuery);
    });
  }, [deferredQuery, reports]);

  const sharedSearch = search.view && search.view !== "split" ? { view: search.view } : {};

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-background px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter reports..."
            className="h-8 pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-4">
        <Link
          to="/reports"
          search={sharedSearch}
          className={cn(
            "mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            !currentReportId
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <FileText className="size-4 shrink-0 text-amber-500" />
          <span className="font-medium">All reports</span>
        </Link>

        <div className="space-y-1">
          {filteredReports.map((report) => {
            const active = report.id === currentReportId;

            return (
              <Link
                key={report.id}
                to="/reports/$id"
                params={{ id: report.id }}
                search={sharedSearch}
                className={cn(
                  "block rounded-md px-2 py-2 transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium" title={report.id}>
                      {report.id}
                    </div>
                    <div className="truncate text-xs text-muted-foreground" title={report.title ?? report.id}>
                      {report.title ?? "Untitled report"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ReportsExplorerSidebar.Skeleton = () => (
  <div className="flex h-full flex-col">
    <div className="px-4 py-2">
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="space-y-2 px-2 pb-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`reports-sidebar-skeleton-${index}`}
          className="rounded-md px-2 py-2"
        >
          <div className="flex items-start gap-2">
            <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
