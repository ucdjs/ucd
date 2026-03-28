import { useExecute } from "#hooks/use-execute";
import { sourceQueryOptions } from "#queries/source";
import { sourcesQueryOptions } from "#queries/sources";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Command,
  useCommandActions,
} from "@ucdjs-internal/shared-ui/ui/command";
import { Loader2, Play, Search, Spline, Terminal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const PIPELINE_PALETTE = "pipeline-server.main";
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

interface PipelinePaletteEntry {
  id: string;
  name?: string | null;
  versions: string[];
  sourceId: string;
  sourceLabel: string;
  fileId: string;
  fileLabel: string;
}

interface CurrentPipelineActionsProps {
  currentPipeline: PipelinePaletteEntry | undefined;
  executing: boolean;
  onExecuteCurrent: () => void;
  onNavigate: (to: string) => void;
}

function CurrentPipelineActions({
  currentPipeline,
  executing,
  onExecuteCurrent,
  onNavigate,
}: CurrentPipelineActionsProps) {
  const actions = useMemo(() => {
    if (!currentPipeline) {
      return [];
    }

    return [
      {
        id: "pipeline.current.execute",
        value: "Execute current pipeline",
        keywords: [
          currentPipeline.name || currentPipeline.id,
          currentPipeline.id,
          currentPipeline.sourceLabel,
          currentPipeline.fileLabel,
          "run",
          "execute",
        ],
        onSelect: onExecuteCurrent,
        icon: executing
          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          : <Play className="mr-2 h-4 w-4" />,
        shortcut: "⌘E",
        disabled: executing,
      },
      {
        id: "pipeline.current.open",
        value: "Open current pipeline",
        keywords: [
          currentPipeline.name || currentPipeline.id,
          currentPipeline.id,
          currentPipeline.sourceLabel,
          currentPipeline.fileLabel,
          "view",
          "open",
        ],
        onSelect: () => onNavigate(`/s/${currentPipeline.sourceId}/${currentPipeline.fileId}/${currentPipeline.id}`),
        icon: <Search className="mr-2 h-4 w-4" />,
      },
      {
        id: "pipeline.current.inspect",
        value: "Inspect current pipeline",
        keywords: [
          currentPipeline.name || currentPipeline.id,
          currentPipeline.id,
          currentPipeline.sourceLabel,
          currentPipeline.fileLabel,
          "debug",
          "inspect",
        ],
        onSelect: () => onNavigate(`/s/${currentPipeline.sourceId}/${currentPipeline.fileId}/${currentPipeline.id}/inspect`),
        icon: <Spline className="mr-2 h-4 w-4" />,
      },
    ];
  }, [currentPipeline, executing, onExecuteCurrent, onNavigate]);

  useCommandActions(PIPELINE_PALETTE, actions);

  return null;
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

  const pipelines = useMemo<PipelinePaletteEntry[]>(() => {
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
        })),
      );
    });
  }, [sourceQueries]);

  const currentPipeline = pipelines.find((pipeline) =>
    pipeline.sourceId === currentSourceId
    && pipeline.fileId === currentFileId
    && pipeline.id === currentPipelineId,
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  }, []);

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

  return (
    <Command.Dialog
      palette={PIPELINE_PALETTE}
      open={open}
      onOpenChange={handleOpenChange}
      value={search}
      onValueChange={setSearch}
    >
      <CurrentPipelineActions
        currentPipeline={currentPipeline}
        executing={executing}
        onExecuteCurrent={() => {
          void handleExecuteCurrent();
        }}
        onNavigate={handleNavigate}
      />

      <Command.Input
        data-testid="pipeline-command-palette-input"
        placeholder="Type a command or search..."
      />

      <Command.List data-testid="pipeline-command-palette-list">
        <Command.Empty>No results found.</Command.Empty>

        {currentPipeline && (
          <Command.Group
            data-testid="pipeline-command-palette-current-group"
            heading="Current Pipeline"
          >
            <Command.Actions />
          </Command.Group>
        )}

        <Command.Group
          data-testid="pipeline-command-palette-all-group"
          heading="All Pipelines"
        >
          {pipelines.map((pipeline) => (
            <Command.Item
              key={`${pipeline.sourceId}-${pipeline.fileId}-${pipeline.id}`}
              data-testid={`pipeline-command-palette-item:${pipeline.sourceId}:${pipeline.fileId}:${pipeline.id}`}
              onSelect={() => handleExecutePipeline(pipeline.sourceId, pipeline.fileId, pipeline.id, pipeline.versions)}
              value={pipeline.name || pipeline.id}
              keywords={[
                pipeline.id,
                pipeline.sourceLabel,
                pipeline.fileLabel,
                pipeline.sourceId,
                pipeline.fileId,
                ...pipeline.versions,
              ]}
              disabled={executing}
            >
              {executing
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Terminal className="mr-2 h-4 w-4" />}
              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <span className="truncate">{pipeline.name || pipeline.id}</span>
                <span className="text-muted-foreground truncate text-[10px]">
                  {pipeline.sourceLabel}
                  {" / "}
                  {pipeline.fileLabel}
                </span>
              </div>
              <span className="text-muted-foreground ml-2 text-xs">
                {pipeline.versions.length}
                {" "}
                versions
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
