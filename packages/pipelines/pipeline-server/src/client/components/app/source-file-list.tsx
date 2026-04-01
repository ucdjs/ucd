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
import { ChevronRight, FileCode, Workflow } from "lucide-react";

export interface SourceFileListProps {
  sourceId: string;
  currentFileId: string | undefined;
  currentPipelineId: string | undefined;
  expanded: Record<string, boolean>;
  toggle: (key: string, isOpen: boolean) => void;
}

type FileTreeNode
  = | { type: "folder"; name: string; path: string; children: FileTreeNode[] }
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
        (node): node is FileTreeNode & { type: "folder" } => node.type === "folder" && node.name === name,
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

function getFileName(file: SourceFileInfo): string {
  const segments = file.path.split("/");
  return segments.at(-1) ?? file.label;
}

export function SourceFileList(props: SourceFileListProps) {
  const { data, isLoading } = useQuery(sourceQueryOptions({ sourceId: props.sourceId }));
  const tree = buildFileTree(data?.files ?? []);

  if (isLoading) {
    return (
      <SidebarMenu>
        <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      {tree.map((node) => (
        <TreeNode key={nodeKey(node)} node={node} {...props} />
      ))}
    </SidebarMenu>
  );
}

function TreeNode({ node, ...props }: { node: FileTreeNode } & SourceFileListProps) {
  if (node.type === "folder") {
    return <FolderNode node={node} {...props} />;
  }
  return <FileNode file={node.file} {...props} />;
}

function FolderNode({ node, ...props }: { node: FileTreeNode & { type: "folder" } } & SourceFileListProps) {
  const stateKey = `${props.sourceId}:dir:${node.path}`;
  const isOpen = props.expanded[stateKey] ?? true;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="sm"
        className="gap-1.5 px-1 text-muted-foreground hover:text-foreground"
        onClick={() => props.toggle(stateKey, isOpen)}
      >
        <ChevronRight className={`size-3 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`} />
        <span className="truncate text-xs font-medium">{node.name}</span>
      </SidebarMenuButton>
      {isOpen && (
        <SidebarMenuSub>
          {node.children.map((child) => (
            <TreeNode key={nodeKey(child)} node={child} {...props} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function FileNode({ file, ...props }: { file: SourceFileInfo } & SourceFileListProps) {
  const stateKey = `${props.sourceId}:${file.id}`;
  const isActive = props.currentFileId === file.id;
  const isOpen = props.expanded[stateKey] ?? isActive;
  const hasPipelines = file.pipelines.length > 0;

  const handleToggle = () => {
    props.toggle(stateKey, isOpen);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        size="sm"
        className="gap-1.5 px-1"
        onClick={handleToggle}
      >
        {hasPipelines
          ? <ChevronRight className={`size-3 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`} />
          : <span className="w-3 shrink-0" />}
        <FileCode className="size-3.5 shrink-0 opacity-60" />
        <span className="truncate">{getFileName(file)}</span>
      </SidebarMenuButton>
      {isOpen && hasPipelines && (
        <SidebarMenuSub>
          {file.pipelines.map((pipeline) => (
            <SidebarMenuSubItem key={`${file.id}-${pipeline.id}`}>
              <SidebarMenuSubButton
                isActive={props.currentPipelineId === pipeline.id && isActive}
                size="sm"
                className="gap-1.5 px-1"
                render={(
                  <Link
                    to="/s/$sourceId/$sourceFileId/$pipelineId"
                    params={{ sourceId: props.sourceId, sourceFileId: file.id, pipelineId: pipeline.id }}
                  >
                    <Workflow className="size-3.5 shrink-0 text-muted-foreground" />
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
