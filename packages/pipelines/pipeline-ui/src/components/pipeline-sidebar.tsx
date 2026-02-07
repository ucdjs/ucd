import { cn } from "#lib/utils";
import { Link, useParams } from "@tanstack/react-router";
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
import { usePipelines } from "@ucdjs/pipelines-ui";
import { BookOpen, ExternalLink, Folder, FolderOpen } from "lucide-react";
import { useMemo, useState } from "react";

export function PipelineSidebar() {
  const { data, loading } = usePipelines();
  const params = useParams({ strict: false }) as { id?: string; file?: string };
  const currentPipelineId = params.id;
  const currentFileSlug = params.file;
  const [openFiles, setOpenFiles] = useState<Record<string, boolean>>({});

  const files = useMemo(() => {
    return data?.files ?? [];
  }, [data?.files]);

  const toggleFile = (fileId: string) => {
    setOpenFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-sidebar-foreground tracking-tight truncate">
            UCD Pipelines
          </h1>
          <p className="text-[10px] text-muted-foreground truncate">Pipeline files</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {loading
              ? (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    Loading...
                  </div>
                )
              : (
                  files.map((file) => {
                      const isFileActive = currentFileSlug === file.fileId;
                    const isOpen = openFiles[file.fileId] ?? isFileActive;
                    const fileName = file.filePath.split("/").pop() ?? file.filePath;

                    return (
                      <SidebarMenuItem key={file.fileId}>
                        <SidebarMenuButton
                          isActive={isFileActive}
                          className="w-full justify-start gap-2"
                          onClick={(event) => {
                            event.preventDefault();
                            toggleFile(file.fileId);
                          }}
                          render={(
                            <Link to="/pipelines/$file" params={{ file: file.fileId }}>
                              {isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                              <span className="truncate flex-1">{fileName}</span>
                              <span className="text-[10px] text-muted-foreground">{file.pipelines.length}</span>
                            </Link>
                          )}
                        />
                        {isOpen && (
                          <SidebarMenuSub>
                              {file.pipelines.map((pipeline) => {
                                const isActive = currentPipelineId === pipeline.id && currentFileSlug === file.fileId;

                              return (
                                <SidebarMenuSubItem key={`${file.fileId}-${pipeline.id}`}>
                                  <SidebarMenuSubButton
                                    isActive={isActive}
                                    render={(
                                        <Link
                                          to="/pipelines/$file/$id"
                                          params={{ file: file.fileId, id: pipeline.id }}
                                        >
                                        <div
                                          className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            pipeline.sourceId.startsWith("github-") && "bg-blue-500",
                                            pipeline.sourceId.startsWith("gitlab-") && "bg-orange-500",
                                            !pipeline.sourceId.startsWith("github-")
                                            && !pipeline.sourceId.startsWith("gitlab-")
                                            && "bg-emerald-500",
                                          )}
                                        />
                                        <span className="truncate flex-1">
                                          {pipeline.name || pipeline.id}
                                        </span>
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
                  })
                )}
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
        {(data?.errors?.length || 0) > 0 && (
          <div className="px-2 py-1.5">
            <p className="text-xs text-destructive font-medium">
              {data?.errors.length}
              {" "}
              error
              {data?.errors.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
