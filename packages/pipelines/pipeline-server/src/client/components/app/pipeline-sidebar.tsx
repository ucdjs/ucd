import { useExecute } from "#hooks/use-execute";
import { usePipelineVersions } from "#hooks/use-pipeline-versions";
import { pipelineQueryOptions } from "#queries/pipeline";
import { sourceQueryOptions } from "#queries/source";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ThemeToggle, UcdLogo } from "@ucdjs-internal/shared-ui/components";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
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
import { ArrowLeft, BookOpen, ClipboardList, ExternalLink, Eye, FileCode2, GitBranch, Hash, Layers, Workflow as PipelineIcon, Play, Tag } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";
import { SourceFileList } from "./source-file-list";
import { SourceSwitcher } from "./source-switcher";

export interface PipelineSidebarProps {
  workspaceId: string;
  version?: string;
}

const PIPELINE_NAV_ITEMS = [
  { id: "overview", label: "Overview", to: "", icon: Eye },
  { id: "inspect", label: "Inspect", to: "/inspect", icon: ClipboardList },
  { id: "executions", label: "Executions", to: "/executions", icon: Layers },
] as const;

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

  const isPipelineView = currentSourceId && currentFileId && currentPipelineId;

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

      {!isPipelineView && (
        <div className="px-3 pb-1.5" data-testid="pipeline-sidebar-source-switcher">
          <SourceSwitcher />
        </div>
      )}

      <SidebarContent data-testid="pipeline-sidebar-content">
        {isPipelineView
          ? (
              <PipelineView
                sourceId={currentSourceId}
                fileId={currentFileId}
                pipelineId={currentPipelineId}
              />
            )
          : currentSourceId && (
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

interface PipelineViewProps {
  sourceId: string;
  fileId: string;
  pipelineId: string;
}

const HOTKEY_EXECUTE_COOLDOWN_MS = 1000;

function PipelineView({ sourceId, fileId, pipelineId }: PipelineViewProps) {
  const { data: pipelineResponse } = useSuspenseQuery(pipelineQueryOptions({ sourceId, fileId, pipelineId }));
  const { data: source } = useSuspenseQuery(sourceQueryOptions({ sourceId }));
  const pipeline = pipelineResponse.pipeline;
  const file = source.files.find((f) => f.id === fileId);

  const { execute, executing } = useExecute();
  const navigate = useNavigate();
  const versionStorageKey = `${sourceId}:${fileId}:${pipelineId}`;
  const { selectedVersions } = usePipelineVersions(versionStorageKey, pipeline.versions);
  const lastHotkeyExecuteAtRef = React.useRef(0);

  const handleExecute = useCallback(async () => {
    const result = await execute(sourceId, fileId, pipelineId, [...selectedVersions]);
    if (result.success && result.executionId) {
      navigate({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId",
        params: {
          sourceId,
          sourceFileId: fileId,
          pipelineId,
          executionId: result.executionId,
        },
      });
    }
  }, [execute, navigate, fileId, pipelineId, selectedVersions, sourceId]);

  useHotkey("Mod+E", () => {
    const now = Date.now();
    if (now - lastHotkeyExecuteAtRef.current < HOTKEY_EXECUTE_COOLDOWN_MS) {
      return;
    }

    lastHotkeyExecuteAtRef.current = now;
    void handleExecute();
  }, {
    preventDefault: true,
    enabled: !executing && selectedVersions.size > 0,
  });

  return (
    <div className="flex flex-col gap-1 px-2" data-testid="pipeline-sidebar-nav">
      <Link
        to="/s/$sourceId"
        params={{ sourceId }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-1"
        data-testid="pipeline-sidebar-back-link"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to source</span>
      </Link>
      <div className="px-1 py-2 space-y-1" data-testid="pipeline-sidebar-identity">
        <h3 className="font-semibold text-sm truncate">{pipeline.name || pipeline.id}</h3>
        {file?.path && (
          <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
            <FileCode2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{file.path}</span>
          </div>
        )}
        {pipeline.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{pipeline.description}</p>
        )}
      </div>
      <SidebarMenu>
        {PIPELINE_NAV_ITEMS.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              render={(
                <Link
                  to={`/s/$sourceId/$sourceFileId/$pipelineId${item.to}`}
                  params={{ sourceId, sourceFileId: fileId, pipelineId }}
                  activeProps={{
                    className: "bg-muted text-foreground font-medium",
                  }}
                  activeOptions={{
                    exact: item.id === "overview",
                  }}
                  data-testid={`pipeline-sidebar-nav-${item.id}`}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              )}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <div className="px-1 py-3 space-y-2 border-t border-border/60" data-testid="pipeline-sidebar-info">
        <SidebarGroupLabel className="px-0 text-[11px]">Pipeline info</SidebarGroupLabel>
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 shrink-0" />
            <span>
              {pipeline.versions.length}
              {" "}
              {pipeline.versions.length === 1 ? "version" : "versions"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <PipelineIcon className="h-3.5 w-3.5 shrink-0" />
            <span>
              {pipeline.routeCount}
              {" "}
              {pipeline.routeCount === 1 ? "route" : "routes"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>
              {pipeline.sourceCount}
              {" "}
              {pipeline.sourceCount === 1 ? "source" : "sources"}
            </span>
          </div>
        </div>
      </div>
      <div className="px-1 pt-2 border-t border-border/60" data-testid="pipeline-sidebar-execute">
        <Button
          className="w-full"
          disabled={executing || selectedVersions.size === 0}
          size="sm"
          onClick={handleExecute}
        >
          <Play className="mr-2 h-4 w-4" />
          {executing ? "Running..." : "Execute"}
        </Button>
      </div>
    </div>
  );
}
