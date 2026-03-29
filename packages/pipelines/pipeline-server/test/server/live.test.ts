import type { PipelineSource } from "#server/app";
import type { FSWatcher } from "chokidar";
import path from "node:path";
import { setupLiveUpdates } from "#server/live";
import chokidar from "chokidar";
import { H3 } from "h3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createTestApp } from "./helpers";

const WORKSPACE_ID = "test";
const LOCAL_SOURCE_ID = "local";

function createMockWatcher() {
  const eventHandlers = new Map<string, (changedPath: string) => void>();
  const watcher = {
    on: vi.fn((event: string, handler: (changedPath: string) => void) => {
      eventHandlers.set(event, handler);
      return watcher;
    }),
    close: vi.fn(async () => {}),
  } as unknown as FSWatcher;

  return {
    watcher,
    emit(event: "add" | "change" | "unlink", changedPath: string) {
      eventHandlers.get(event)?.(changedPath);
    },
  };
}

function createLocalSource(dir: string): Extract<PipelineSource, { kind: "local" }> {
  return {
    kind: "local",
    id: LOCAL_SOURCE_ID,
    path: dir,
  };
}

function getSentEvent(peer: { send: { mock: { calls: Array<[string]> } } }, callIndex = 0) {
  return JSON.parse(peer.send.mock.calls[callIndex]![0]);
}

async function connectLivePeer(app: H3) {
  const response = await app.fetch(new Request("http://localhost/api/live"));
  const hooks = (response as Response & {
    crossws: {
      open: (peer: { send: (message: string) => void }) => void;
    };
  }).crossws;
  const peer = {
    send: vi.fn<(message: string) => void>(),
  };

  hooks.open(peer);

  return peer;
}

async function setupLocalLiveTest(files: Record<string, string>) {
  const dir = await testdir(files);
  const sources = [createLocalSource(dir)];
  const { app } = await createTestApp({ sources });
  const mockWatcher = createMockWatcher();
  const watchSpy = vi.spyOn(chokidar, "watch").mockReturnValue(mockWatcher.watcher);
  const live = setupLiveUpdates(app, {
    sources,
    workspaceId: WORKSPACE_ID,
  });

  await vi.waitFor(() => {
    expect(watchSpy).toHaveBeenCalledOnce();
  });

  return {
    app,
    dir,
    live,
    ...mockWatcher,
  };
}

describe("setupLiveUpdates", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("closes watchers for local sources", async () => {
    const { live, watcher } = await setupLocalLiveTest({
      "alpha.ucd-pipeline.ts": "export const alpha = {};",
    });

    await live.close();

    expect(watcher.close).toHaveBeenCalledTimes(1);
  });

  it("ignores remote-only sources", async () => {
    const app = new H3();
    const watchSpy = vi.spyOn(chokidar, "watch");
    const live = setupLiveUpdates(app, {
      workspaceId: WORKSPACE_ID,
      sources: [{
        kind: "remote",
        id: "remote",
        provider: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
      }],
    });

    expect(watchSpy).not.toHaveBeenCalled();
    await live.close();
  });

  it("sends a ready event when a peer connects", async () => {
    const { app, live } = await setupLocalLiveTest({
      "alpha.ucd-pipeline.ts": "export const alpha = {};",
    });
    const peer = await connectLivePeer(app);

    expect(peer.send).toHaveBeenCalledTimes(1);
    expect(getSentEvent(peer)).toMatchObject({
      type: "ready",
      workspaceId: WORKSPACE_ID,
    });

    await live.close();
  });

  it("broadcasts source.changed when a watched file is added", async () => {
    const { app, dir, emit, live, watcher } = await setupLocalLiveTest({
      "alpha.ucd-pipeline.ts": "export const alpha = {};",
    });
    const peer = await connectLivePeer(app);
    peer.send.mockClear();

    emit("add", path.join(dir, "beta.ucd-pipeline.ts"));

    await vi.waitFor(() => {
      expect(peer.send).toHaveBeenCalled();
      expect(getSentEvent(peer)).toMatchObject({
        type: "source.changed",
        sourceId: LOCAL_SOURCE_ID,
        changes: [{
          kind: "add",
          path: "beta.ucd-pipeline.ts",
        }],
      });
    });

    await live.close();
    expect(watcher.close).toHaveBeenCalledTimes(1);
  });
});
