import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@ucdjs-internal/shared-ui/ui/command";
import { FileCode, Play, ScrollText, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

interface PipelineCommandPaletteProps {
  pipelines: PipelineInfo[];
  currentPipelineId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecute: (pipelineId: string, versions: string[]) => void;
  onNavigate: (to: string) => void;
}

export function PipelineCommandPalette({
  pipelines,
  currentPipelineId,
  open,
  onOpenChange,
  onExecute,
  onNavigate,
}: PipelineCommandPaletteProps) {
  const [search, setSearch] = useState("");

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const currentPipeline = pipelines.find((p) => p.id === currentPipelineId);

  const handleExecuteCurrent = () => {
    if (currentPipeline) {
      onExecute(currentPipeline.id, currentPipeline.versions);
      onOpenChange(false);
    }
  };

  const handleExecutePipeline = (pipeline: PipelineInfo) => {
    onExecute(pipeline.id, pipeline.versions);
    onOpenChange(false);
  };

  const handleNavigate = (to: string) => {
    onNavigate(to);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {currentPipeline && (
            <CommandGroup heading="Current Pipeline">
              <CommandItem onSelect={handleExecuteCurrent}>
                <Play className="mr-2 h-4 w-4" />
                Execute Current Pipeline
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate(`/pipelines/${currentPipeline.id}/code`)}>
                <FileCode className="mr-2 h-4 w-4" />
                View Current Pipeline Code
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate(`/pipelines/${currentPipeline.id}/logs`)}>
                <ScrollText className="mr-2 h-4 w-4" />
                View Current Pipeline Logs
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="All Pipelines">
            {pipelines.map((pipeline) => (
              <CommandItem
                key={pipeline.id}
                onSelect={() => handleExecutePipeline(pipeline)}
                value={pipeline.id}
              >
                <Terminal className="mr-2 h-4 w-4" />
                {pipeline.name || pipeline.id}
                <span className="ml-2 text-xs text-muted-foreground">
                  {pipeline.versions.length} versions
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
