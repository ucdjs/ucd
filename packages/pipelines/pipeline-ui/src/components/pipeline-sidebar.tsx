import type { LoadError, PipelineFileInfo } from "../types";
import { cn } from "#lib/utils";
import { Link } from "@tanstack/react-router";
import { ThemeToggle, ThemeToggleFallback, UcdLogo } from "@ucdjs-internal/shared-ui/components";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { AlertTriangle, BookOpen, ExternalLink, Folder, FolderOpen, Hash, Tag } from "lucide-react";
import { useMemo, useState } from "react";
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
  files: PipelineFileInfo[];
  errors: LoadError[];
  sources: SourceInfo[];
  currentSourceId?: string;
  onToggleErrorPanel: () => void;
  isErrorPanelOpen: boolean;
}

export function PipelineSidebar({
  files,
  errors,
  sources,
  currentSourceId,
  onToggleErrorPanel,
  isErrorPanelOpen,
  workspaceId,
  version,
}: PipelineSidebarProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() => new Set());

  const toggleFile = (fileId: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const filesBySource = useMemo(() => {
    const grouped = new Map<string, PipelineFileInfo[]>();
    for (const file of files) {
      const existing = grouped.get(file.sourceId) || [];
      existing.push(file);
      grouped.set(file.sourceId, existing);
    }
    return grouped;
  }, [files]);

  const errorsBySource = useMemo(() => {
    const grouped = new Map<string, LoadError[]>();
    for (const error of errors) {
      if (!error.sourceId) continue;
      const existing = grouped.get(error.sourceId) || [];
      existing.push(error);
      grouped.set(error.sourceId, existing);
    }
    return grouped;
  }, [errors]);

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
          const sourceErrors = errorsBySource.get(source.id) || [];
          const hasErrors = sourceErrors.length > 0;

          return (
            <SidebarGroup key={source.id}>
              <SidebarGroupLabel className={cn(hasErrors && "text-destructive")}>
                {source.id}
                {hasErrors && <AlertTriangle className="h-3 w-3 ml-1" />}
              </SidebarGroupLabel>
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
                          errors={sourceErrors}
                          isExpanded={expandedFiles.has(file.fileId)}
                          onToggle={() => toggleFile(file.fileId)}
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

        {errors.length > 0 && (
          <div className="px-2 py-1.5">
            <button
              onClick={onToggleErrorPanel}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isErrorPanelOpen
                  ? "bg-destructive/10 text-destructive"
                  : "bg-destructive/5 text-destructive hover:bg-destructive/10",
              )}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                {errors.length}
                {" "}
                error
                {errors.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[10px] opacity-70">
                {isErrorPanelOpen ? "Hide" : "Show"}
              </span>
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

interface FileMenuItemProps {
  file: PipelineFileInfo;
  errors: LoadError[];
  isExpanded: boolean;
  onToggle: () => void;
}

function FileMenuItem({ file, errors, isExpanded, onToggle }: FileMenuItemProps) {
  const fileName = file.fileLabel ?? file.filePath.split("/").pop() ?? file.filePath;
  const hasError = errors.some((e) => e.filePath === file.filePath);
  const fileError = errors.find((e) => e.filePath === file.filePath);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          "w-full justify-start gap-2",
          hasError && "opacity-50 cursor-not-allowed",
        )}
        onClick={(event) => {
          if (hasError) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          onToggle();
        }}
        title={fileError?.message}
        render={(
          <Link to="/$sourceId/$fileId" params={{ sourceId: file.sourceId, fileId: file.fileId }}>
            {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            <span className="truncate flex-1">{fileName}</span>
            {hasError && <AlertTriangle className="h-3 w-3 text-destructive" />}
            <span className="text-[10px] text-muted-foreground">{file.pipelines.length}</span>
          </Link>
        )}
      />
      {isExpanded && !hasError && (
        <SidebarMenuSub>
          {file.pipelines.map((pipeline) => (
            <SidebarMenuSubItem key={`${file.fileId}-${pipeline.id}`}>
              <SidebarMenuSubButton
                render={(
                  <Link
                    to="/$sourceId/$fileId/$pipelineId"
                    params={{ sourceId: file.sourceId, fileId: file.fileId, pipelineId: pipeline.id }}
                  >
                    <span className="truncate flex-1">{pipeline.name || pipeline.id}</span>
                  </Link>
                )}
              />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
