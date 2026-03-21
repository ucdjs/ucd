import { sourcesQueryOptions } from "#queries/sources";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { Check, ChevronsUpDown, GitBranch, Search } from "lucide-react";
import * as React from "react";

function getTypeBadge(type: "local" | "github" | "gitlab") {
  if (type === "github") {
    return { label: "GitHub", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  }
  if (type === "gitlab") {
    return { label: "GitLab", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
  }
  return { label: "Local", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
}

export function SourceSwitcher() {
  const { data } = useSuspenseQuery(sourcesQueryOptions());
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentSourceId = React.useMemo(() => {
    if ("sourceId" in params && typeof params.sourceId === "string") {
      return params.sourceId;
    }
    return null;
  }, [params]);

  const sources = data ?? [];
  const currentSource = sources.find((s) => s.id === currentSourceId) ?? null;

  const filtered = React.useMemo(() => {
    if (!search) return sources;
    const lower = search.toLowerCase();
    return sources.filter((s) => s.label.toLowerCase().includes(lower));
  }, [sources, search]);

  const handleSelect = React.useCallback((sourceId: string) => {
    setOpen(false);
    setSearch("");
    navigate({ to: "/s/$sourceId", params: { sourceId } });
  }, [navigate]);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div ref={containerRef} className="relative">
          <SidebarMenuButton
            data-testid="source-switcher-trigger"
            size="lg"
            className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            data-state={open ? "open" : "closed"}
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <GitBranch className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none min-w-0">
              <span className="font-semibold truncate">
                {currentSource ? currentSource.label : sources[0]?.label ?? "No sources"}
              </span>
              {currentSource && (
                <span className="text-xs text-muted-foreground">
                  {currentSource.fileCount}
                  {" "}
                  {currentSource.fileCount === 1 ? "file" : "files"}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </SidebarMenuButton>

          {open && (
            <div
              data-testid="source-switcher-popup"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border/60 bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100"
            >
              {sources.length > 1 && (
                <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                  <Search className="size-3.5 text-muted-foreground shrink-0" />
                  <input
                    data-testid="source-switcher-search"
                    type="text"
                    placeholder="Search sources..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              )}
              <div className="max-h-60 overflow-y-auto p-1">
                {filtered.map((source) => {
                  const badge = getTypeBadge(source.type);
                  const isActive = source.id === currentSourceId;
                  return (
                    <button
                      type="button"
                      key={source.id}
                      data-testid={`source-switcher-option:${source.id}`}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSelect(source.id)}
                    >
                      <span className="size-4 shrink-0 flex items-center justify-center">
                        {isActive && <Check className="size-3.5" />}
                      </span>
                      <span className="flex-1 truncate text-left">{source.label}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </button>
                  );
                })}
                {filtered.length === 0 && search && (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No sources match "{search}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function SourceSwitcherSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-sidebar/60 px-3 py-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col gap-1 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
