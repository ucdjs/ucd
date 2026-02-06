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
} from "@ucdjs-internal/shared-ui/ui/sidebar";
import { usePipelines } from "@ucdjs/pipelines-ui";
import { BookOpen, ExternalLink } from "lucide-react";

export function PipelineSidebar() {
  const { data, loading } = usePipelines();
  const { id: currentPipelineId } = useParams({ strict: false });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-sidebar-foreground tracking-tight truncate">
            UCD Pipelines
          </h1>
          {data?.cwd && (
            <p
              className="text-[10px] text-muted-foreground truncate"
              title={data.cwd}
            >
              {data.cwd}
            </p>
          )}
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
                  data?.pipelines.map((pipeline) => {
                    const isActive = currentPipelineId === pipeline.id;

                    return (
                      <SidebarMenuItem key={pipeline.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          className="w-full justify-start gap-2"
                          render={(
                            <Link to="/pipelines/$id" params={{ id: pipeline.id }}>
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
