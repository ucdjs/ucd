import { useExecute } from "#hooks/use-execute";
import { sourceQueryOptions } from "#queries/source";
import { sourcesQueryOptions } from "#queries/sources";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
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
import { FileCode, Loader2, Play, Search, Terminal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const { data: sourcesData } = useSuspenseQuery(sourcesQueryOptions());
  const sourceQueries = useQueries({
    queries: sourcesData.map((source) => sourceQueryOptions({ sourceId: source.id })),
  });
  const { execute, executing } = useExecute();
  const navigate = useNavigate();
  const {
    pipelineId: currentPipelineId,
    sourceFileId: currentFileId,
    sourceId: currentSourceId,
  } = useParams({ strict: false });

  const pipelines = useMemo(() => {
    return sourceQueries.flatMap((query) => {
      const source = query.data;
      if (!source) {
        return [];
      }

      return source.files.flatMap((file) =>
        file.pipelines.map((pipeline) => ({
          ...pipeline,
          sourceId: source.id,
          sourceLabel: source.label,
          fileId: file.id,
          fileLabel: file.label,
        }))
      );
    });
  }, [sourceQueries]);

  const currentPipeline = pipelines.find((pipeline) =>
    pipeline.sourceId === currentSourceId
    && pipeline.fileId === currentFileId
    && pipeline.id === currentPipelineId,
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleExecuteCurrent = useCallback(async () => {
    if (!currentPipeline || executing) return;
    try {
      const versionsToExecute = getSelectedVersionsFromStorage(
        `${currentPipeline.sourceId}:${currentPipeline.fileId}:${currentPipeline.id}`,
        currentPipeline.versions,
      );
      await execute(currentPipeline.sourceId, currentPipeline.fileId, currentPipeline.id, versionsToExecute);
      setOpen(false);
    } catch (err) {
      console.error("Failed to execute pipeline:", err);
    }
  }, [currentPipeline, execute, executing]);

  const handleExecutePipeline = useCallback(async (sourceId: string, fileId: string, pipelineId: string, versions: string[]) => {
    if (executing) return;
    try {
      const versionsToExecute = getSelectedVersionsFromStorage(`${sourceId}:${fileId}:${pipelineId}`, versions);
      await execute(sourceId, fileId, pipelineId, versionsToExecute);
      setOpen(false);
    } catch (err) {
      console.error("Failed to execute pipeline:", err);
    }
  }, [execute, executing]);

  const handleNavigate = useCallback((to: string) => {
    navigate({ to });
    setOpen(false);
  }, [navigate]);

  useHotkey("Mod+K", (event) => {
    event.preventDefault();
    setOpen((value) => !value);
  });

  useHotkey(
    "Mod+E",
    (event) => {
      event.preventDefault();
      void handleExecuteCurrent();
    },
    { enabled: open && Boolean(currentPipeline) && !executing },
  );

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
              <CommandItem onSelect={() => handleNavigate(`/s/${currentPipeline.sourceId}/${currentPipeline.fileId}/${currentPipeline.id}`)}>
                <Search className="mr-2 h-4 w-4" />
                Open Current Pipeline
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate(`/s/${currentPipeline.sourceId}/${currentPipeline.fileId}/${currentPipeline.id}/inspect`)}>
                <FileCode className="mr-2 h-4 w-4" />
                Inspect Current Pipeline
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="All Pipelines">
            {pipelines.map((pipeline) => (
              <CommandItem
                key={`${pipeline.sourceId}-${pipeline.fileId}-${pipeline.id}`}
                onSelect={() => handleExecutePipeline(pipeline.sourceId, pipeline.fileId, pipeline.id, pipeline.versions)}
                value={`${pipeline.sourceId}-${pipeline.fileId}-${pipeline.id}`}
                disabled={executing}
              >
                {executing
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Terminal className="mr-2 h-4 w-4" />}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="truncate">{pipeline.name || pipeline.id}</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {pipeline.sourceLabel}
                    {" / "}
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
