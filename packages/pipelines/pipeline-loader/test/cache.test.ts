import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { getRemoteSourceCacheStatus } from "../src/cache";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getUcdConfigPath;

describe("remote cache status", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("returns uncached status for missing marker", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const status = await getRemoteSourceCacheStatus({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "miss-ref",
    });

    expect(status.cached).toBe(false);
    expect(status.commitSha).toBe("");
    expect(status.syncedAt).toBeNull();
  });

  it("returns cached status for valid github marker", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const cacheDir = path.join(tmpBaseDir, "github", "ucdjs", "ucd-pipelines", "hit-ref");
    const syncedAt = new Date().toISOString();
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path.join(cacheDir, ".ucd-cache.json"), JSON.stringify({
      source: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "hit-ref",
      commitSha: "hit-sha",
      syncedAt,
    }));

    const status = await getRemoteSourceCacheStatus({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "hit-ref",
    });

    expect(status.cached).toBe(true);
    expect(status.commitSha).toBe("hit-sha");
    expect(status.syncedAt).toBe(syncedAt);
  });
});
