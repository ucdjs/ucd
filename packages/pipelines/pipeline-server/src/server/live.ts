import type { SourceChange, SourceChangedEvent } from "#shared/schemas/live";
import type { FSWatcher } from "chokidar";
import type { H3 } from "h3";
import type { PipelineSource } from "./app";
import { stat } from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import { plugin as websocketPlugin } from "crossws/server";
import { defineWebSocketHandler } from "h3";

const PIPELINE_FILE_SUFFIX = ".ucd-pipeline.ts";
const WATCH_DEBOUNCE_MS = 100;
const IGNORED_DIR_NAMES = new Set(["node_modules", ".git", "dist", "build"]);

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function shouldIgnoreDirectory(dirPath: string): boolean {
  const segments = normalizePath(dirPath).split("/").filter(Boolean);
  return segments.some((segment) => IGNORED_DIR_NAMES.has(segment));
}

function isPipelineFile(filePath: string): boolean {
  return normalizePath(filePath).endsWith(PIPELINE_FILE_SUFFIX);
}

function isRelevantChange(filePath: string): boolean {
  return !shouldIgnoreDirectory(filePath) && isPipelineFile(filePath);
}

function relativeChangePath(rootPath: string, pathKind: "file" | "directory", changedPath: string): string {
  if (pathKind === "file") {
    return path.basename(changedPath);
  }

  return normalizePath(path.relative(rootPath, changedPath));
}

function createWatchOptions(pathKind: "file" | "directory") {
  if (pathKind === "file") {
    return {
      ignoreInitial: true,
    };
  }

  return {
    ignoreInitial: true,
    ignored: (watchedPath: string, stats?: { isDirectory: () => boolean; isFile: () => boolean }) => {
      if (stats?.isDirectory()) {
        return shouldIgnoreDirectory(watchedPath);
      }

      if (stats?.isFile()) {
        return !isRelevantChange(watchedPath);
      }

      return shouldIgnoreDirectory(watchedPath);
    },
  };
}

export function setupLiveUpdates(
  app: H3,
  { sources, workspaceId }: { sources: PipelineSource[]; workspaceId: string },
): {
  plugins: ReturnType<typeof websocketPlugin>[];
  close: () => Promise<void>;
} {
  const peers = new Set<{ send: (message: string) => void }>();
  const watcherStarts: Promise<FSWatcher | null>[] = [];
  const flushTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const pendingChanges = new Map<string, Map<string, SourceChange>>();
  let closed = false;

  function broadcast(event: { type: "ready"; workspaceId: string; occurredAt: string } | SourceChangedEvent) {
    const message = JSON.stringify(event);

    for (const peer of peers) {
      peer.send(message);
    }
  }

  function queueChange(sourceId: string, change: SourceChange) {
    const sourceChanges = pendingChanges.get(sourceId) ?? new Map<string, SourceChange>();
    sourceChanges.set(change.path, change);
    pendingChanges.set(sourceId, sourceChanges);

    const existingTimer = flushTimers.get(sourceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      flushTimers.delete(sourceId);

      const batchedChanges = pendingChanges.get(sourceId);
      if (!batchedChanges || batchedChanges.size === 0) {
        return;
      }

      pendingChanges.delete(sourceId);

      broadcast({
        type: "source.changed",
        sourceId,
        changes: [...batchedChanges.values()],
        occurredAt: new Date().toISOString(),
      } satisfies SourceChangedEvent);
    }, WATCH_DEBOUNCE_MS);

    flushTimers.set(sourceId, timer);
  }

  async function createWatcher(source: Extract<PipelineSource, { kind: "local" }>): Promise<FSWatcher | null> {
    const resolvedPath = path.resolve(source.path);
    const stats = await stat(resolvedPath).catch(() => null);

    if (!stats) {
      return null;
    }

    const pathKind = stats.isDirectory() ? "directory" : stats.isFile() ? "file" : null;
    if (!pathKind) {
      return null;
    }

    if (pathKind === "file" && !isPipelineFile(resolvedPath)) {
      return null;
    }

    const rootPath = pathKind === "file" ? path.dirname(resolvedPath) : resolvedPath;
    // eslint-disable-next-line no-console
    console.log(`Setting up watcher for source "${source.id}" at path: ${resolvedPath}`);
    const watcher = chokidar.watch(resolvedPath, createWatchOptions(pathKind));

    const handleEvent = (kind: SourceChange["kind"], changedPath: string) => {
      if (pathKind === "directory" && !isRelevantChange(changedPath)) {
        return;
      }

      if (pathKind === "file" && path.resolve(changedPath) !== resolvedPath) {
        return;
      }

      queueChange(source.id, {
        kind,
        path: relativeChangePath(rootPath, pathKind, changedPath),
      });
    };

    watcher.on("add", (changedPath) => handleEvent("add", changedPath));
    watcher.on("change", (changedPath) => handleEvent("change", changedPath));
    watcher.on("unlink", (changedPath) => handleEvent("unlink", changedPath));

    return watcher;
  }

  app.get("/api/live", defineWebSocketHandler({
    open(peer) {
      peers.add(peer);
      peer.send(JSON.stringify({
        type: "ready",
        workspaceId,
        occurredAt: new Date().toISOString(),
      }));
    },
    close(peer) {
      peers.delete(peer);
    },
  }));

  const localSources = sources.filter((source): source is Extract<PipelineSource, { kind: "local" }> =>
    source.kind === "local");

  for (const source of localSources) {
    watcherStarts.push(createWatcher(source));
  }

  return {
    plugins: [websocketPlugin({
      resolve: async (req) => {
        // @ts-expect-error - The types for h3's fetch event are not compatible with crossws, but the runtime objects are compatible
        return (await app.fetch(req)).crossws;
      },
    })],
    async close() {
      if (closed) {
        return;
      }

      closed = true;

      for (const timer of flushTimers.values()) {
        clearTimeout(timer);
      }

      flushTimers.clear();
      pendingChanges.clear();

      const resolvedWatchers = await Promise.all(watcherStarts);
      await Promise.allSettled(
        resolvedWatchers
          .filter((watcher): watcher is FSWatcher => watcher != null)
          .map((watcher) => watcher.close()),
      );

      peers.clear();
    },
  };
}
