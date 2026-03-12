import { sourceQueryOptions } from "#queries/source";
import { sourcesQueryOptions } from "#queries/sources";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ThemeToggle, UcdLogo } from "@ucdjs-internal/shared-ui/components";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, Folder, FolderOpen, Hash, Tag } from "lucide-react";
import * as React from "react";
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

interface SourceGroupProps extends SourceFileListProps {
  sourceLabel: string;
  currentSourceId: string | undefined;
  isOpen: boolean;
  toggleSource: (sourceId: string) => void;
}

function SourceGroup({
  sourceId,
  sourceLabel,
  currentSourceId,
  currentFileId,
  currentPipelineId,
  isOpen,
  toggleSource,
  openFiles,
  toggleFile,
}: SourceGroupProps) {
  const isActive = currentSourceId === sourceId;
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  return (
    <>
      <div className="mx-1 flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1">
        <SidebarGroupAction
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${sourceLabel}`}
          className="static -ml-1.5 flex h-7 w-7 shrink-0 translate-y-0 items-center justify-center rounded-md p-0 hover:bg-sidebar-accent"
          onClick={() => toggleSource(sourceId)}
        >
          <ChevronIcon className="size-4" />
        </SidebarGroupAction>
        <SidebarGroupLabel className="h-auto flex-1 px-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/75">
          <Link
            to="/s/$sourceId"
            params={{ sourceId }}
            className={isActive
              ? "block truncate text-sidebar-foreground"
              : "block truncate hover:text-sidebar-foreground"}
          >
            {sourceLabel}
          </Link>
        </SidebarGroupLabel>
      </div>
      {isOpen && (
        <SourceFileList
          sourceId={sourceId}
          currentFileId={currentFileId}
          currentPipelineId={currentPipelineId}
          openFiles={openFiles}
          toggleFile={toggleFile}
        />
      )}
    </>
  );
}

interface SourceFileListProps {
  sourceId: string;
  currentFileId: string | undefined;
  currentPipelineId: string | undefined;
  openFiles: Record<string, boolean>;
  toggleFile: (key: string) => void;
}

function SourceFileList({
  sourceId,
  currentFileId,
  currentPipelineId,
  openFiles,
  toggleFile,
}: SourceFileListProps) {
  const { data, isLoading } = useQuery(sourceQueryOptions({ sourceId }));

  if (isLoading) {
    return (
      <SidebarMenu className="mt-1 gap-1.5">
        <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>
      </SidebarMenu>
    );
  }

  const files = data?.files ?? [];

  return (
    <SidebarMenu className="mt-1 gap-1.5">
      {files.map((file) => {
        const fileKey = `${sourceId}:${file.id}`;
        const isFileActive = currentFileId === file.id;
        const isOpen = openFiles[fileKey] ?? (isFileActive || files[0]?.id === file.id);

        return (
          <SidebarMenuItem key={file.id}>
            <SidebarMenuButton
              isActive={isFileActive}
              className="h-9 w-full justify-start gap-2 rounded-md px-2.5"
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                toggleFile(fileKey);
              }}
              render={(
                <Link
                  to="/s/$sourceId/$sourceFileId"
                  params={{ sourceId, sourceFileId: file.id }}
                >
                  {isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                  <span className="truncate flex-1">{file.label}</span>
                  <span className="rounded-sm bg-sidebar-accent/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {file.pipelines.length}
                  </span>
                </Link>
              )}
            />
            {isOpen && file.pipelines.length > 0 && (
              <SidebarMenuSub className="mx-3.5 mt-1 gap-1 border-l border-sidebar-border px-2.5 py-1.5">
                {file.pipelines.map((pipeline) => {
                  const isActive = currentPipelineId === pipeline.id && currentFileId === file.id;
                  return (
                    <SidebarMenuSubItem key={`${file.id}-${pipeline.id}`}>
                      <SidebarMenuSubButton
                        isActive={isActive}
                        className="h-8 rounded-md px-2.5"
                        render={(
                          <Link
                            to="/s/$sourceId/$sourceFileId/$pipelineId"
                            params={{ sourceId, sourceFileId: file.id, pipelineId: pipeline.id }}
                          >
                            <span className="truncate flex-1">{pipeline.name || pipeline.id}</span>
                          </Link>
                        )}
                      />
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
