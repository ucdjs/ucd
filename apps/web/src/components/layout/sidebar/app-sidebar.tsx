import type { ComponentProps } from "react";
import { Link, useLoaderData, useMatches, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@ucdjs-internal/shared-ui/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { BookOpen, ExternalLink, Grid3X3, Lightbulb, Type } from "lucide-react";
import { Suspense, useState } from "react";
import { UcdLogo } from "../../ucd-logo";
import { VersionSwitcher, VersionSwitcherSkeleton } from "../../version-switcher";

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
] as const;

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { ucdjsApiBaseUrl } = useLoaderData({ from: "__root__" });
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname ?? "";
  const currentVersionMatch = matches.find((m) => (m.params as any)?.version !== undefined);
  const currentVersion = currentVersionMatch ? (currentVersionMatch.params as any).version : undefined;

  const isMainItemActive = (to: string, exact = false) => {
    if (exact) {
      return currentPath === to || currentPath === `${to}/`;
    }
    return currentPath.startsWith(to.replace(/\/\$/, "/"));
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
          >
            <div className="rounded-lg p-1 transition-colors group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <UcdLogo className="size-10 shrink-0 group-data-[collapsible=icon]:size-9" />
            </div>
            <div className="grid text-left leading-tight group-data-[collapsible=icon]:hidden">
              <h2 className="font-semibold text-base">UCD.js</h2>
              <span className="text-xs text-muted-foreground">Unicode Database</span>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2 group-data-[collapsible=icon]:ml-0">
            <div className="group-data-[collapsible=icon]:hidden">
              <ThemeToggle />
            </div>
            <SidebarTrigger className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
          </div>
        </div>
        <form
          className="mt-3 w-full group-data-[collapsible=icon]:hidden"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem("sidebar-search") as HTMLInputElement | null;
            const value = input?.value?.trim() ?? "";
            if (!value) return;
            setSearchValue("");
            navigate({
              to: "/search",
              search: currentVersion ? { q: value, version: currentVersion } : { q: value },
            });
          }}
        >
          <SidebarInput
            name="sidebar-search"
            placeholder="Search Unicode"
            autoComplete="off"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </form>
        <div className="mt-3 w-full group-data-[collapsible=icon]:hidden">
          <Suspense fallback={<VersionSwitcherSkeleton />}>
            <VersionSwitcher />
          </Suspense>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {currentVersion
          ? (
              <SidebarGroup>
                <SidebarGroupLabel>
                  Version:
                  {" "}
                  {currentVersion}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {VERSION_ITEMS.map((item) => {
                    const isActive = isMainItemActive(item.to, false);
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={isActive}
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
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            )
          : null}

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {TOOLS_ITEMS.map((item) => {
              const isActive = isMainItemActive(item.to, false);
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={isActive}
                    render={(
                      <Link to={item.to} params={"params" in item ? item.params : undefined}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  />
                </SidebarMenuItem>
              );
            })}
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
