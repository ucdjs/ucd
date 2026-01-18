import type { UnicodeVersion } from "@ucdjs/schemas";
import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { UVersion } from "../../u-version";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../../ui/sidebar";

const DEFAULT_VISIBLE_VERSIONS = 5;

function getBadgeLabel(v: UnicodeVersion): { label: string; cls: string } {
  const year = v.date ? Number.parseInt(String(v.date), 10) : undefined;
  const age = year ? new Date().getFullYear() - year : undefined;

  if (age === undefined) return { label: "Unknown", cls: "bg-muted text-muted-foreground" };
  if (age <= 1) return { label: "Recent", cls: "bg-green-100 text-green-700" };
  if (age <= 3) return { label: "Mature", cls: "bg-blue-100 text-blue-700" };
  if (age <= 5) return { label: "Old", cls: "bg-muted text-muted-foreground" };
  return { label: "Legacy", cls: "bg-muted/60 text-muted-foreground/80" };
}

export function VersionsList() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const [showAll, setShowAll] = useState(false);
  const visibleVersions = showAll ? versions : versions.slice(0, DEFAULT_VISIBLE_VERSIONS);
  const hiddenCount = versions.length - DEFAULT_VISIBLE_VERSIONS;

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupLabel>Versions</SidebarGroupLabel>
      <SidebarMenu>
        <div className="overflow-auto" style={{ height: "10rem" }}>
          {visibleVersions.map((v) => {
            const badge = getBadgeLabel(v);

            return (
              <SidebarMenuItem key={v.version}>
                <SidebarMenuButton render={(
                  <Link to="/v/$version" params={{ version: v.version }}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className={v.version === versions?.[0]?.version ? "text-primary" : "text-muted-foreground"}>
                          <UVersion version={v.version} size={16} />
                        </span>
                        <span className="text-sm">
                          Unicode
                          {" "}
                          {v.version}
                        </span>
                      </div>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </Link>
                )}
                />
              </SidebarMenuItem>
            );
          })}
        </div>

        {hiddenCount > 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setShowAll(!showAll)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={`size-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
              <span>{showAll ? "Show less" : `Show ${hiddenCount} more`}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function VersionsListSkeleton() {
  return (
    <SidebarGroup className="mt-auto animate-pulse">
      <div className="h-4 bg-muted rounded w-16 mb-4" />
      <SidebarMenu>
        <div className="overflow-auto" style={{ height: "10rem" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <div className="flex items-center justify-between gap-2 py-2 px-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-4 bg-muted rounded w-4" />
                  <div className="h-4 bg-muted rounded flex-1" />
                </div>
                <div className="h-4 bg-muted rounded w-12" />
              </div>
            </SidebarMenuItem>
          ))}
        </div>
      </SidebarMenu>
    </SidebarGroup>
  );
}
