import { useLoaderData, useNavigate, useParams } from "@tanstack/react-router";
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
import { ChevronsUpDown, Database } from "lucide-react";
import { useCallback, useMemo } from "react";

export interface SourceSwitcherProps {
  sources: string[];
}

export function SourceSwitcher({ sources }: SourceSwitcherProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  const currentSourceId = useMemo(() => {
    if ("sourceId" in params && typeof params.sourceId === "string") {
      return params.sourceId;
    }
    return undefined;
  }, [params]);

  const handleSourceSelect = useCallback((selectedSource: string) => {
    if (selectedSource === currentSourceId) return;

    if (!selectedSource) {
      navigate({ to: "/" });
      return;
    }

    navigate({
      to: "/$sourceId",
      params: { sourceId: selectedSource },
    });
  }, [currentSourceId, navigate]);

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
                  <Database className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Source</span>
                  <span className="text-xs truncate max-w-35">
                    {currentSourceId || "All Sources"}
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
            <DropdownMenuItem
              onClick={() => handleSourceSelect("")}
              className={!currentSourceId ? "bg-accent text-accent-foreground" : undefined}
            >
              <span className="flex-1">All Sources</span>
            </DropdownMenuItem>
            {sources.map((source) => {
              const isCurrent = source === currentSourceId;
              return (
                <DropdownMenuItem
                  key={source}
                  onClick={() => handleSourceSelect(source)}
                  className={isCurrent ? "bg-accent text-accent-foreground" : undefined}
                >
                  <span className="flex-1 truncate">{source}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
