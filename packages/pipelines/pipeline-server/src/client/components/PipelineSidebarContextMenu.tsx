import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/context-menu";
import { Copy, FileCode, FolderOpen, Play } from "lucide-react";
import { useState } from "react";
import { VersionPickerDialog } from "./VersionPickerDialog";

interface PipelineSidebarContextMenuProps {
  pipeline: PipelineInfo;
  children: React.ReactNode;
  onExecute: (versions: string[]) => void;
  onNavigate: (to: string) => void;
}

export function PipelineSidebarContextMenu({
  pipeline,
  children,
  onExecute,
  onNavigate,
}: PipelineSidebarContextMenuProps) {
  const [showVersionPicker, setShowVersionPicker] = useState(false);

  const handleExecuteAll = () => {
    onExecute(pipeline.versions);
  };

  const handleExecuteWithVersions = (versions: string[]) => {
    onExecute(versions);
    setShowVersionPicker(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(pipeline.id);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger render={() => (
          <div className="w-full">{children}</div>
        )}
        />

        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleExecuteAll}>
            <Play className="mr-2 h-4 w-4" />
            Execute All Versions
            <ContextMenuShortcut>↵</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => setShowVersionPicker(true)}>
            <Play className="mr-2 h-4 w-4" />
            Execute with Versions...
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => onNavigate(`/pipelines/${pipeline.id}/code`)}>
            <FileCode className="mr-2 h-4 w-4" />
            View Code
          </ContextMenuItem>

          <ContextMenuItem onClick={handleCopyId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Pipeline ID
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <VersionPickerDialog
        pipeline={pipeline}
        open={showVersionPicker}
        onOpenChange={setShowVersionPicker}
        onExecute={handleExecuteWithVersions}
      />
    </>
  );
}
