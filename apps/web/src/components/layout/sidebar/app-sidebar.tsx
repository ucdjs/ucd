import type { ComponentProps } from "react";
import { Link, useLoaderData, useMatches } from "@tanstack/react-router";
import { BookOpen, ExternalLink, FlaskConical, Grid3X3, Lightbulb, Search, Type } from "lucide-react";
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
import { UcdLogo } from "../../ucd-logo";
import { VersionSwitcher } from "../../version-switcher";

const MAIN_ITEMS = [
  { to: "/", icon: BookOpen, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
] as const;

const VERSION_ITEMS = [
  { to: "/v/$version", icon: BookOpen, label: "Overview" },
  { to: "/v/$version/blocks", icon: Grid3X3, label: "Blocks" },
  { to: "/v/$version/grapheme-visualizer", icon: Lightbulb, label: "Grapheme Visualizer" },
  { to: "/v/$version/normalization-preview", icon: Lightbulb, label: "Normalization Preview" },
  { to: "/v/$version/bidi-linebreak", icon: Lightbulb, label: "BIDI & Line Break" },
  { to: "/v/$version/font-glyph-view", icon: Lightbulb, label: "Font & Glyph View" },
  { to: "/v/$version/u/$hex", params: { hex: "0041" }, icon: Type, label: "Codepoint Visualizer" },
] as const;

const TOOLS_ITEMS = [
  { to: "/file-explorer/$", params: { _splat: "" }, icon: BookOpen, label: "File Explorer" },
  { to: "/diffs-playground", icon: FlaskConical, label: "Diffs Playground" },
] as const;

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { ucdjsApiBaseUrl } = useLoaderData({ from: "__root__" });

  const matches = useMatches();
  const currentVersionMatch = matches.find((m) => (m.params as any)?.version !== undefined);
  const currentVersion = currentVersionMatch ? (currentVersionMatch.params as any).version : undefined;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center"
        >
          <UcdLogo className="size-10 shrink-0 group-data-[collapsible=icon]:size-8" />
          <div className="grid text-left leading-tight group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold text-base">UCD.js</h2>
            <span className="text-xs text-muted-foreground">Unicode Database</span>
          </div>
        </Link>
        <div className="mt-3 w-full">
          <VersionSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {MAIN_ITEMS.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  render={(
                    <Link to={item.to}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {currentVersion
          ? (
              <SidebarGroup>
                <SidebarGroupLabel>
                  Version:
                  {" "}
                  {currentVersion}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {VERSION_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        render={(
                          <Link
                            to={item.to}
                            params={{ version: currentVersion, ...("params" in item ? item.params : {}) }}
                          >
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        )}
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )
          : null}

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {TOOLS_ITEMS.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  render={(
                    <Link to={item.to} params={"params" in item ? item.params : undefined}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(
                  <a href="https://docs.ucdjs.dev">
                    <BookOpen className="size-4" />
                    <span>Getting Started</span>
                  </a>
                )}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(
                  <a href={ucdjsApiBaseUrl ?? "https://api.ucdjs.dev"} target="_blank" rel="noopener noreferrer">
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
