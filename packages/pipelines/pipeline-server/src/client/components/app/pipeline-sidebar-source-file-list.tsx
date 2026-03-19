import type { SourceFileInfo } from "#shared/schemas/source";
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
import { ChevronRight, FileCode, Route } from "lucide-react";
import { useMemo } from "react";

export interface SourceFileListProps {
  sourceId: string;
  currentFileId: string | undefined;
  currentPipelineId: string | undefined;
  expanded: Record<string, boolean>;
  toggle: (key: string, isOpen: boolean) => void;
}

type FileTreeNode =
  | { type: "folder"; name: string; path: string; children: FileTreeNode[] }
  | { type: "file"; file: SourceFileInfo };

function buildFileTree(files: SourceFileInfo[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const file of files) {
    const segments = file.path.split("/");
    let current = root;
    let pathSoFar = "";
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i]!;
      pathSoFar = pathSoFar ? `${pathSoFar}/${name}` : name;
      let folder = current.find(
        (n): n is FileTreeNode & { type: "folder" } => n.type === "folder" && n.name === name,
      );
      if (!folder) {
        folder = { type: "folder", name, path: pathSoFar, children: [] };
        current.push(folder);
      }
      current = folder.children;
    }
    current.push({ type: "file", file });
  }
  return root;
}

function nodeKey(node: FileTreeNode): string {
  return node.type === "folder" ? `d:${node.path}` : node.file.id;
}

function fileName(file: SourceFileInfo): string {
  const segments = file.path.split("/");
  return segments[segments.length - 1] ?? file.label;
}

export function SourceFileList(props: SourceFileListProps) {
  const { data, isLoading } = useQuery(sourceQueryOptions({ sourceId: props.sourceId }));

  if (isLoading) {
    return (
      <SidebarMenu>
        <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>
      </SidebarMenu>
    );
  }

  const files = data?.files;
  const tree = useMemo(() => buildFileTree(files ?? []), [files]);

  return (
    <SidebarMenu>
      {tree.map(node => (
        <TreeNode key={nodeKey(node)} node={node} {...props} />
      ))}
    </SidebarMenu>
  );
}

function TreeNode({ node, ...p }: { node: FileTreeNode } & SourceFileListProps) {
  if (node.type === "folder") {
    const stateKey = `${p.sourceId}:dir:${node.path}`;
    const isOpen = p.expanded[stateKey] ?? true;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="sm"
          className="gap-1.5 px-1 text-muted-foreground hover:text-foreground"
          onClick={() => p.toggle(stateKey, isOpen)}
        >
          <ChevronRight className={`size-3 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`} />
          <span className="truncate text-xs font-medium">{node.name}</span>
        </SidebarMenuButton>
        {isOpen && (
          <SidebarMenuSub>
            {node.children.map(child => (
              <TreeNode key={nodeKey(child)} node={child} {...p} />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  const { file } = node;
  const stateKey = `${p.sourceId}:${file.id}`;
  const isActive = p.currentFileId === file.id;
  const isOpen = p.expanded[stateKey] ?? isActive;
  const hasPipelines = file.pipelines.length > 0;

  return (
    <SidebarMenuItem>
      <div className="flex items-center">
        {hasPipelines
          ? (
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => p.toggle(stateKey, isOpen)}
              >
                <ChevronRight className={`size-3 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`} />
              </button>
            )
          : <span className="w-5 shrink-0" />}
        <SidebarMenuButton
          isActive={isActive}
          size="sm"
          className="flex-1 gap-1.5 px-1"
          render={(
            <Link
              to="/s/$sourceId/$sourceFileId"
              params={{ sourceId: p.sourceId, sourceFileId: file.id }}
            >
              <FileCode className="size-3.5 shrink-0 opacity-60" />
              <span className="truncate">{fileName(file)}</span>
              {hasPipelines && (
                <span className="ml-auto rounded bg-sidebar-accent/60 px-1 py-0.5 text-[10px] leading-none text-muted-foreground tabular-nums">
                  {file.pipelines.length}
                </span>
              )}
            </Link>
          )}
        />
      </div>
      {isOpen && hasPipelines && (
        <SidebarMenuSub>
          {file.pipelines.map(pipeline => (
            <SidebarMenuSubItem key={`${file.id}-${pipeline.id}`}>
              <SidebarMenuSubButton
                isActive={p.currentPipelineId === pipeline.id && isActive}
                size="sm"
                className="gap-1.5 px-1"
                render={(
                  <Link
                    to="/s/$sourceId/$sourceFileId/$pipelineId"
                    params={{ sourceId: p.sourceId, sourceFileId: file.id, pipelineId: pipeline.id }}
                  >
                    <Route className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{pipeline.name || pipeline.id}</span>
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
