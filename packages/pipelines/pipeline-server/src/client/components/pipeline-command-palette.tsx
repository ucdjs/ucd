import { useNavigate, useParams } from "@tanstack/react-router";
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
import { useExecute, usePipelines } from "@ucdjs/pipelines-ui";
import { FileCode, Loader2, Play, ScrollText, Terminal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "ucd-versions-";

function getSelectedVersionsFromStorage(storageKey: string, allVersions: string[]): string[] {
  if (typeof window === "undefined") {
    return allVersions;
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${storageKey}`);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const validVersions = parsed.filter((v) => allVersions.includes(v));
      if (validVersions.length > 0) {
        return validVersions;
      }
    }
  } catch {
    // Fall through to default
  }

  return allVersions;
}

export function PipelineCommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = usePipelines();
  const { execute, executing } = useExecute();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const file = typeof params.file === "string" ? params.file : undefined;
  const sourceId = typeof params.sourceId === "string" ? params.sourceId : undefined;
  const currentPipelineId = typeof params.id === "string" ? params.id : undefined;

  const files = data?.files ?? [];
  const pipelines = files.flatMap((fileInfo) =>
    fileInfo.pipelines.map((pipeline) => ({
      ...pipeline,
      fileId: fileInfo.fileId,
      fileLabel: fileInfo.fileLabel ?? fileInfo.filePath,
    })),
  );
  const currentPipeline = pipelines.find((p) => p.id === currentPipelineId && p.fileId === file);

  // Toggle command palette with ⌘K
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

  // Execute current pipeline with ⌘E when palette is open
  useEffect(() => {
    if (!open || !currentPipeline || executing) return;

    const down = async (e: KeyboardEvent) => {
      if (e.key === "e" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        try {
          const versionsToExecute = getSelectedVersionsFromStorage(
            `${currentPipeline.fileId}:${currentPipeline.id}`,
            currentPipeline.versions,
          );
          await execute(currentPipeline.fileId, currentPipeline.id, versionsToExecute, currentPipeline.sourceId);
          setOpen(false);
        } catch (err) {
          console.error("Failed to execute pipeline:", err);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, currentPipeline, execute, executing]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleExecuteCurrent = useCallback(async () => {
    if (!currentPipeline || executing) return;
    try {
      const versionsToExecute = getSelectedVersionsFromStorage(
        `${currentPipeline.fileId}:${currentPipeline.id}`,
        currentPipeline.versions,
      );
      await execute(currentPipeline.fileId, currentPipeline.id, versionsToExecute, currentPipeline.sourceId);
      setOpen(false);
    } catch (err) {
      console.error("Failed to execute pipeline:", err);
    }
  }, [currentPipeline, execute, executing]);

  const handleExecutePipeline = useCallback(async (sourceId: string, fileId: string, pipelineId: string, versions: string[]) => {
    if (executing) return;
    try {
      const versionsToExecute = getSelectedVersionsFromStorage(`${fileId}:${pipelineId}`, versions);
      await execute(fileId, pipelineId, versionsToExecute, sourceId);
      setOpen(false);
    } catch (err) {
      console.error("Failed to execute pipeline:", err);
    }
  }, [execute, executing]);

  const handleNavigate = useCallback((to: string) => {
    navigate({ to });
    setOpen(false);
  }, [navigate]);

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

          {currentPipeline && (
            <CommandGroup heading="Current Pipeline">
              <CommandItem
                onSelect={handleExecuteCurrent}
                disabled={executing}
              >
                {executing
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Play className="mr-2 h-4 w-4" />}
                Execute Current Pipeline
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate(`/pipelines/${currentPipeline.fileId}/${currentPipeline.id}/code`)}>
                <FileCode className="mr-2 h-4 w-4" />
                View Current Pipeline Code
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate(`/pipelines/${currentPipeline.fileId}/${currentPipeline.id}/executions`)}>
                <ScrollText className="mr-2 h-4 w-4" />
                View Pipeline Executions
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="All Pipelines">
            {pipelines.map((pipeline) => (
              <CommandItem
                key={`${pipeline.fileId}-${pipeline.id}`}
                onSelect={() => handleExecutePipeline(pipeline.sourceId, pipeline.fileId, pipeline.id, pipeline.versions)}
                value={`${pipeline.fileId}-${pipeline.id}`}
                disabled={executing}
              >
                {executing
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Terminal className="mr-2 h-4 w-4" />}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="truncate">{pipeline.name || pipeline.id}</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {pipeline.fileLabel}
                  </span>
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  {pipeline.versions.length}
                  {" "}
                  versions
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
