import { sourcesQueryOptions } from "#queries/sources";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ThemeToggle, UcdLogo } from "@ucdjs-internal/shared-ui/components";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
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
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { BookOpen, ExternalLink, Hash, Tag } from "lucide-react";
import * as React from "react";
import { SourceFileList } from "./pipeline-sidebar-source-file-list";
import { SourceGroup } from "./pipeline-sidebar-source-group";
import { SourceSwitcher } from "./source-switcher";

export interface PipelineSidebarProps {
  workspaceId: string;
  version?: string;
}

export function PipelineSidebar({
  workspaceId,
  version,
}: PipelineSidebarProps) {
  const { data: sourcesData } = useSuspenseQuery(sourcesQueryOptions());
  const params = useParams({ strict: false });

  const currentSourceId = "sourceId" in params && typeof params.sourceId === "string"
    ? params.sourceId
    : undefined;
  const currentFileId = "sourceFileId" in params && typeof params.sourceFileId === "string"
    ? params.sourceFileId
    : undefined;
  const currentPipelineId = "pipelineId" in params && typeof params.pipelineId === "string"
    ? params.pipelineId
    : undefined;

  const [openSources, setOpenSources] = React.useState<Record<string, boolean>>({});
  const [openFiles, setOpenFiles] = React.useState<Record<string, boolean>>({});

  const toggleSource = (sourceId: string) => {
    setOpenSources((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }));
  };

  const toggleFile = (key: string) => {
    setOpenFiles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sources = sourcesData ?? [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="rounded-lg p-1 transition-colors">
                <UcdLogo className="size-10 shrink-0" />
              </div>
              <div className="grid text-left leading-tight">
                <h2 className="font-semibold text-base">UCD.js</h2>
                <span className="text-xs text-muted-foreground">Pipeline Server</span>
              </div>
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {workspaceId && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 gap-1 font-mono bg-primary/5 border-primary/20 max-w-full"
                title={workspaceId}
              >
                <Hash className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate">{workspaceId}</span>
              </Badge>
            )}
            {version && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 gap-1 font-mono bg-secondary/5 border-secondary/20 max-w-full"
                title={version}
              >
                <Tag className="h-3 w-3 text-secondary-foreground shrink-0" />
                <span className="truncate">{version}</span>
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <div className="px-4 pb-2">
        <SourceSwitcher />
      </div>

      <SidebarContent>
        {currentSourceId
          ? (
              <SidebarGroup className="px-3 py-2">
                <SourceFileList
                  sourceId={currentSourceId}
                  currentFileId={currentFileId}
                  currentPipelineId={currentPipelineId}
                  openFiles={openFiles}
                  toggleFile={toggleFile}
                />
              </SidebarGroup>
            )
          : (
              sources.map((source) => (
                <SidebarGroup key={source.id} className="px-3 py-2">
                  <SourceGroup
                    sourceId={source.id}
                    sourceLabel={source.label}
                    currentSourceId={currentSourceId}
                    currentFileId={currentFileId}
                    currentPipelineId={currentPipelineId}
                    isOpen={openSources[source.id] ?? source.id === currentSourceId}
                    toggleSource={toggleSource}
                    openFiles={openFiles}
                    toggleFile={toggleFile}
                  />
                </SidebarGroup>
              ))
            )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(
                  <a href="https://docs.ucdjs.dev/pipelines">
                    <BookOpen className="size-4" />
                    <span>Getting Started</span>
                  </a>
                )}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(
                  <a href="https://docs.ucdjs.dev/pipelines/api" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    <span>API Reference</span>
                  </a>
                )}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
