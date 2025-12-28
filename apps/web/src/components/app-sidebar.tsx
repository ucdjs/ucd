import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Layers } from "lucide-react";
import * as React from "react";
import { versionsQueryOptions } from "@/apis/versions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavItem } from "./nav";
import { UcdLogo } from "./ucd-logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());

  // Build navigation items from versions
  const navItems = React.useMemo(() => {
    return [
      {
        title: "Versions",
        url: "#",
        icon: Layers,
        isActive: false,
        items: versions.map((v) => ({
          title: `Unicode ${v.version}`,
          url: `/v/${v.version}`,
        })),
      },
    ];
  }, [versions]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
          <UcdLogo className="size-10 shrink-0 group-data-[collapsible=icon]:size-8" />
          <div className="grid text-left leading-tight group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold text-base">UCD.js</h2>
            <span className="text-xs text-muted-foreground">Unicode Database</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => <NavItem key={item.title} item={item} />)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Explorer</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={(
                <Link to="/file-explorer/$" params={{ _splat: "" }}>
                  <BookOpen className="size-4" />
                  <span>File Explorer</span>
                </Link>
              )}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={(
                <Link to="/docs/$" params={{ _splat: "ucdjs" }}>
                  <BookOpen className="size-4" />
                  <span>Getting Started</span>
                </Link>
              )}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={(
                <a href={import.meta.env.VITE_UCDJS_API_BASE_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  <span>API Reference</span>
                </a>
              )}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
