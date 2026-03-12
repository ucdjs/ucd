import type * as React from "react";
import { sourceQueryOptions } from "#queries/source";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { Folder, FolderOpen } from "lucide-react";

export interface SourceTreeStateProps {
  currentFileId: string | undefined;
  currentPipelineId: string | undefined;
  openFiles: Record<string, boolean>;
  toggleFile: (key: string) => void;
}

export interface SourceFileListProps extends SourceTreeStateProps {
  sourceId: string;
}

export function SourceFileList({
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
              className="h-9 w-full gap-2 rounded-md px-2.5"
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                toggleFile(fileKey);
              }}
              render={(
                <Link
                  to="/s/$sourceId/$sourceFileId"
                  params={{ sourceId, sourceFileId: file.id }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                  </span>
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
