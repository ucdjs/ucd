import path from "node:path";
import { setupLiveUpdates } from "#server/live";
import type { FSWatcher } from "chokidar";
import chokidar from "chokidar";
import { H3 } from "h3";
import { describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createTestApp } from "./helpers";

describe("setupLiveUpdates", () => {
  it("sets up local source watching without throwing", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": "export const alpha = {};",
    });
    const sources = [{
      kind: "local" as const,
      id: "local",
      path: dir,
    }];
    const { app } = await createTestApp({
      sources,
    });
    const live = setupLiveUpdates(app, {
      sources,
      workspaceId: "test",
    });
    expect(live.plugins).toHaveLength(1);
    await live.close();
  });

  it("ignores remote-only sources without throwing", async () => {
    const app = new H3();
    const live = setupLiveUpdates(app, {
      workspaceId: "test",
      sources: [{
        kind: "remote",
        id: "remote",
        provider: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
      }],
    });

    expect(live.plugins).toHaveLength(1);
    await live.close();
  });

  it("closes cleanly for local directory sources", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": "export const alpha = {};",
      "notes.txt": "hello",
    });
    const sources = [{
      kind: "local" as const,
      id: "local",
      path: dir,
    }];
    const { app } = await createTestApp({
      sources,
    });
    const live = setupLiveUpdates(app, {
      sources,
      workspaceId: "test",
    });
    expect(live.plugins).toHaveLength(1);
    await live.close();
  });

  it("broadcasts source.changed when a watched file is added", async () => {
    const dir = await testdir({
      "alpha.ucd-pipeline.ts": "export const alpha = {};",
    });
    const sources = [{
      kind: "local" as const,
      id: "local",
      path: dir,
    }];
    const { app } = await createTestApp({
      sources,
    });
    const eventHandlers = new Map<string, (changedPath: string) => void>();
    const watcher = {
      on: vi.fn((event: string, handler: (changedPath: string) => void) => {
        eventHandlers.set(event, handler);
        return watcher;
      }),
      close: vi.fn(async () => {}),
    } as unknown as FSWatcher;
    const watchSpy = vi.spyOn(chokidar, "watch").mockReturnValue(watcher);
    const live = setupLiveUpdates(app, {
      sources,
      workspaceId: "test",
    });

    try {
      await vi.waitFor(() => {
        expect(watchSpy).toHaveBeenCalled();
      });

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
      peer.send.mockClear();

      eventHandlers.get("add")?.(path.join(dir, "beta.ucd-pipeline.ts"));

      await vi.waitFor(() => {
        expect(peer.send).toHaveBeenCalled();
        expect(JSON.parse(peer.send.mock.calls[0]![0])).toMatchObject({
          type: "source.changed",
          sourceId: "local",
          changes: [{
            kind: "add",
            path: "beta.ucd-pipeline.ts",
          }],
        });
      });

      await live.close();
    } finally {
      watchSpy.mockRestore();
    }
  });
});
