import { setupLiveUpdates } from "#server/live";
import { H3 } from "h3";
import { describe, expect, it } from "vitest";
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
});
