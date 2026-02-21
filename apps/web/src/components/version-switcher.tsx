import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ChevronsUpDown, Layers } from "lucide-react";
import * as React from "react";

function getBadgeLabel(date?: string | number, isDraft?: boolean) {
  const year = date ? Number.parseInt(String(date), 10) : undefined;
  const age = year ? new Date().getFullYear() - year : undefined;
  if (isDraft) return { label: "Draft", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  if (age === undefined) return { label: "Unknown", cls: "bg-muted text-muted-foreground" };
  if (age <= 1) return { label: "Recent", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  if (age <= 3) return { label: "Mature", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  if (age <= 5) return { label: "Old", cls: "bg-muted text-muted-foreground" };
  return { label: "Legacy", cls: "bg-muted/60 text-muted-foreground/80" };
}

export function VersionSwitcher() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  const currentVersion = React.useMemo(() => {
    if ("version" in params && typeof params.version === "string") {
      return params.version;
    }

    return versions.find((v) => v.type === "stable")?.version || "";
  }, [params, versions]);

  const handleVersionSelect = React.useCallback((selectedVersion: string) => {
    if (!selectedVersion || selectedVersion === currentVersion) return;

    const currentPath = window.location.pathname;
    const match = currentPath.match(/^\/v\/([^/]+)(\/.*)?$/);

    if (match) {
      const subRoute = match[2] || "/";
      navigate({
        to: `/v/${selectedVersion}${subRoute}` as "/v/$version",
        params: { version: selectedVersion },
      });
    } else {
      navigate({ to: "/v/$version", params: { version: selectedVersion } });
    }
  }, [currentVersion, navigate]);

  if (!versions?.length) {
    return null;
  }

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
                  <Layers className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Unicode</span>
                  <span className="text-xs">
                    v
                    {currentVersion}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent
            align="start"
            className="overflow-auto"
            style={{ width: "var(--anchor-width)", maxHeight: "18rem" }}
          >
            {versions.map((version) => {
              const badge = getBadgeLabel(version.date ?? undefined, version.type === "draft");
              const isCurrent = version.version === currentVersion;
              return (
                <DropdownMenuItem
                  key={version.version}
                  onSelect={(event) => {
                    event.preventDefault();
                    handleVersionSelect(version.version);
                  }}
                  onClick={() => handleVersionSelect(version.version)}
                  className={isCurrent ? "bg-accent text-accent-foreground" : undefined}
                >
                  <span className="flex-1">
                    v
                    {version.version}
                  </span>
                  <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${badge.cls}`}>
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

VersionSwitcher.Skeleton = function VersionSwitcherSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-sidebar/60 px-3 py-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col gap-1 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
