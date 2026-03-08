import { sourcesQueryOptions } from "#queries/sources";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ChevronsUpDown, GitBranch } from "lucide-react";
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

  const currentSourceId = React.useMemo(() => {
    if ("sourceId" in params && typeof params.sourceId === "string") {
      return params.sourceId;
    }
    return null;
  }, [params]);

  const sources = data ?? [];

  const currentSource = sources.find((s) => s.id === currentSourceId) ?? null;

  const handleSelect = React.useCallback((sourceId: string | null) => {
    if (sourceId == null) {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/s/$sourceId", params: { sourceId } });
    }
  }, [navigate]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(triggerProps) => (
              <SidebarMenuButton
                {...triggerProps}
                size="lg"
                className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GitBranch className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none min-w-0">
                  <span className="font-semibold truncate">
                    {currentSource ? currentSource.label : "All Sources"}
                  </span>
                  {currentSource && (
                    <span className="text-xs text-muted-foreground">
                      {currentSource.fileCount}
                      {" "}
                      {currentSource.fileCount === 1 ? "file" : "files"}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto shrink-0" />
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent
            align="start"
            className="overflow-auto"
            style={{ width: "var(--anchor-width)", maxHeight: "18rem" }}
          >
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                handleSelect(null);
              }}
              onClick={() => handleSelect(null)}
              className={currentSourceId == null ? "bg-accent text-accent-foreground" : undefined}
            >
              <span className="flex-1">All Sources</span>
            </DropdownMenuItem>
            {sources.map((source) => {
              const badge = getTypeBadge(source.type);
              const isActive = source.id === currentSourceId;
              return (
                <DropdownMenuItem
                  key={source.id}
                  onSelect={(event) => {
                    event.preventDefault();
                    handleSelect(source.id);
                  }}
                  onClick={() => handleSelect(source.id)}
                  className={isActive ? "bg-accent text-accent-foreground" : undefined}
                >
                  <span className="flex-1 truncate">{source.label}</span>
                  <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

SourceSwitcher.Skeleton = function SourcePickerSkeleton() {
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
};
