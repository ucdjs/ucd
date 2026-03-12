import type { SourceFileListProps } from "./pipeline-sidebar-source-file-list";
import { Link } from "@tanstack/react-router";
import { SidebarGroupAction, SidebarGroupLabel } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SourceFileList } from "./pipeline-sidebar-source-file-list";

export interface SourceGroupProps extends SourceFileListProps {
  sourceLabel: string;
  currentSourceId: string | undefined;
  isOpen: boolean;
  toggleSource: (sourceId: string) => void;
}

export function SourceGroup({
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
      <div className="mx-1 flex min-w-0 items-center h-9 w-full gap-2 rounded-md px-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          <SidebarGroupAction
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${sourceLabel}`}
            className="static flex h-7 w-7 translate-y-0 items-center justify-center rounded-md p-0 hover:bg-sidebar-accent"
            onClick={() => toggleSource(sourceId)}
          >
            <ChevronIcon className="size-4" />
          </SidebarGroupAction>
        </div>
        <SidebarGroupLabel className="h-auto min-w-0 flex-1 px-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/75">
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
