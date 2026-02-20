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

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Current Pipeline">
            <CommandItem
              // onSelect={handleExecuteCurrent}
              // disabled={executing}
            >
              <Play className="mr-2 h-4 w-4" />
              Execute Current Pipeline
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
            <CommandItem
              // onSelect={() => handleNavigate(`/pipelines/${currentPipeline.fileId}/${currentPipeline.id}/code`)}
            >
              <FileCode className="mr-2 h-4 w-4" />
              View Current Pipeline Code
            </CommandItem>
            <CommandItem
              // onSelect={() => handleNavigate(`/pipelines/${currentPipeline.fileId}/${currentPipeline.id}/executions`)}
            >
              <ScrollText className="mr-2 h-4 w-4" />
              View Pipeline Executions
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="All Pipelines">
            <CommandItem
              // key={`${pipeline.fileId}-${pipeline.id}`}
              // onSelect={() => handleExecutePipeline(pipeline.fileId, pipeline.id, pipeline.versions)}
              // value={`${pipeline.fileId}-${pipeline.id}`}
              // disabled={executing}
            >
              <Terminal className="mr-2 h-4 w-4" />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="truncate">pipeline.name || pipeline.id</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  pipeline.fileLabel
                </span>
              </div>
              <span className="ml-2 text-xs text-muted-foreground">
                10 versions
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
