import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Layers, Search } from "lucide-react";
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

function UcdLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="15 15 70 70"
      width="100%"
      height="100%"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="20" y="20" width="60" height="60" rx="8" fill="#10B981" opacity="0.2" />
      <path d="M35 40 L65 40 M35 50 L55 50 M35 60 L60 60" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
      <circle cx="70" cy="30" r="8" fill="#059669" opacity="0.8" />
    </svg>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: versions = [], isLoading } = useQuery(versionsQueryOptions());

  // Build navigation items from versions
  const navItems = React.useMemo(() => {
    if (isLoading || versions.length === 0) {
      return [
        {
          title: "Versions",
          url: "#",
          icon: Layers,
          isActive: true,
          items: [],
        },
      ];
    }

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
      {
        title: "Explorer",
        url: "/explorer",
        icon: Search,
      },
    ];
  }, [versions, isLoading]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <UcdLogo className="size-10 shrink-0" />
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={(
                <Link to="/docs/$">
                  <BookOpen className="size-4" />
                  <span>Getting Started</span>
                </Link>
              )}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={(
                <a href="https://api.ucdjs.dev" target="_blank" rel="noopener noreferrer">
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
