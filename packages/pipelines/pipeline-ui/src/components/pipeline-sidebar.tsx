import type { SourceFileSummary } from "../schemas/source";
import { cn } from "#lib/utils";
import { Link } from "@tanstack/react-router";
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
import { BookOpen, ExternalLink, Folder, Hash, Tag } from "lucide-react";
import { useMemo } from "react";
import { SourceSwitcher } from "./source-switcher";

export interface SourceInfo {
  id: string;
  type: "local" | "github" | "gitlab";
  fileCount?: number;
  pipelineCount?: number;
  errorCount?: number;
}

export interface PipelineSidebarProps {
  workspaceId: string;
  version?: string;
  files: SourceFileSummary[];
  sources: SourceInfo[];
  currentSourceId?: string;
}

export function PipelineSidebar({
  files,
  sources,
  currentSourceId,
  workspaceId,
  version,
}: PipelineSidebarProps) {
  const filesBySource = useMemo(() => {
    const grouped = new Map<string, SourceFileSummary[]>();
    for (const file of files) {
      const existing = grouped.get(file.sourceId) || [];
      existing.push(file);
      grouped.set(file.sourceId, existing);
    }
    return grouped;
  }, [files]);

  const sourcesToShow = useMemo(() => {
    if (currentSourceId) {
      return sources.filter((s) => s.id === currentSourceId);
    }
    return sources;
  }, [sources, currentSourceId]);

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
        <SourceSwitcher sources={sources.map((s) => s.id)} />
      </div>

      <SidebarContent>
        {sourcesToShow.map((source) => {
          const sourceFiles = filesBySource.get(source.id) || [];

          return (
            <SidebarGroup key={source.id}>
              <SidebarGroupLabel>{source.id}</SidebarGroupLabel>
              <SidebarMenu>
                {sourceFiles.length === 0
                  ? (
                      <SidebarMenuItem>
                        <span className="text-xs text-muted-foreground px-2">No files</span>
                      </SidebarMenuItem>
                    )
                  : (
                      sourceFiles.map((file) => (
                        <FileMenuItem
                          key={file.fileId}
                          file={file}
                        />
                      ))
                    )}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
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

interface FileMenuItemProps {
  file: SourceFileSummary;
}

function FileMenuItem({ file }: FileMenuItemProps) {
  const fileName = file.fileLabel ?? file.filePath.split("/").pop() ?? file.filePath;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="w-full justify-start gap-2"
        render={(
          <Link to="/$sourceId/$fileId" params={{ sourceId: file.sourceId, fileId: file.fileId }}>
            <Folder className="h-4 w-4" />
            <span className="truncate flex-1">{fileName}</span>
            <span className="text-[10px] text-muted-foreground">{file.pipelineCount}</span>
          </Link>
        )}
      />
    </SidebarMenuItem>
  );
}
