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
import { SourceFileList } from "./source-file-list";
import { SourceSwitcher } from "./source-switcher";

export interface PipelineSidebarProps {
  workspaceId: string;
  version?: string;
}

export function PipelineSidebar({
  workspaceId,
  version,
}: PipelineSidebarProps) {
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

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggle = React.useCallback((key: string, isOpen: boolean) => {
    setExpanded((prev) => ({ ...prev, [key]: !isOpen }));
  }, []);

  return (
    <Sidebar data-testid="pipeline-sidebar">
      <SidebarHeader className="p-3" data-testid="pipeline-sidebar-header">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              data-testid="pipeline-sidebar-home-link"
            >
              <div className="rounded-lg transition-colors">
                <UcdLogo className="size-9 shrink-0" />
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
                data-testid="pipeline-sidebar-workspace"
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
                data-testid="pipeline-sidebar-version"
                title={version}
              >
                <Tag className="h-3 w-3 text-secondary-foreground shrink-0" />
                <span className="truncate">{version}</span>
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <div className="px-3 pb-1.5" data-testid="pipeline-sidebar-source-switcher">
        <SourceSwitcher />
      </div>

      <SidebarContent data-testid="pipeline-sidebar-content">
        {currentSourceId && (
          <SidebarGroup className="px-2 py-1" data-testid={`pipeline-sidebar-current-source:${currentSourceId}`}>
            <SourceFileList
              sourceId={currentSourceId}
              currentFileId={currentFileId}
              currentPipelineId={currentPipelineId}
              expanded={expanded}
              toggle={toggle}
            />
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter data-testid="pipeline-sidebar-footer">
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(
                  <a href="https://docs.ucdjs.dev/pipelines" data-testid="pipeline-sidebar-docs-getting-started">
                    <BookOpen className="size-4" />
                    <span>Getting Started</span>
                  </a>
                )}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={(
                  <a
                    href="https://docs.ucdjs.dev/pipelines/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="pipeline-sidebar-docs-api"
                  >
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
