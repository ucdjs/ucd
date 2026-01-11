import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Layers } from "lucide-react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { versionsQueryOptions } from "@/functions/versions";

function getBadgeLabel(date?: string | number) {
  const year = date ? Number.parseInt(String(date), 10) : undefined;
  const age = year ? new Date().getFullYear() - year : undefined;
  if (age === undefined) return { label: "Unknown", cls: "bg-muted text-muted-foreground" };
  if (age <= 1) return { label: "Recent", cls: "bg-green-100 text-green-700" };
  if (age <= 3) return { label: "Mature", cls: "bg-blue-100 text-blue-700" };
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
    return versions[0]?.version || "";
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
              const badge = getBadgeLabel(version.date ?? undefined);
              const isCurrent = version.version === currentVersion;
              return (
                <DropdownMenuItem
                  key={version.version}
                  onSelect={(event) => {
                    event.preventDefault();
                    handleVersionSelect(version.version);
                  }}
                  onClick={() => handleVersionSelect(version.version)}
                >
                  <span className="flex-1">
                    v
                    {version.version}
                  </span>
                  <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {isCurrent && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
