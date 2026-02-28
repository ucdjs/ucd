import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { getRemoteSourceCacheStatus } from "../src/cache";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getBaseRepoCacheDir: vi.fn(),
  };
});

const getBaseRepoCacheDirMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getBaseRepoCacheDir;

describe("remote cache status", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("returns marker-missing for uncached github source", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/miss-ref", () => {
        return HttpResponse.json({ sha: "miss-sha" });
      }],
    ]);

    const status = await getRemoteSourceCacheStatus({
      source: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "miss-ref",
    });

    expect(status.cached).toBe(false);
    expect(status.reason).toBe("marker-missing");
  });

  it("returns cache-hit for valid github marker", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

    const cacheDir = path.join(tmpBaseDir, "github", "ucdjs", "ucd-pipelines", "hit-sha");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path.join(cacheDir, ".ucd-cache.json"), JSON.stringify({
      source: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      commitSha: "hit-sha",
      createdAt: new Date().toISOString(),
    }));

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/hit-ref", () => {
        return HttpResponse.json({ sha: "hit-sha" });
      }],
    ]);

    const status = await getRemoteSourceCacheStatus({
      source: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "hit-ref",
    });

    expect(status.cached).toBe(true);
    expect(status.reason).toBe("cache-hit");
  });

  it("returns marker-invalid for mismatched marker", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

    const cacheDir = path.join(tmpBaseDir, "gitlab", "ucdjs", "ucd-pipelines", "sha-x");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path.join(cacheDir, ".ucd-cache.json"), JSON.stringify({
      source: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      commitSha: "different-sha",
      createdAt: new Date().toISOString(),
    }));

    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/ref-x", () => {
        return HttpResponse.json({ id: "sha-x" });
      }],
    ]);

    const status = await getRemoteSourceCacheStatus({
      source: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "ref-x",
    });

    expect(status.cached).toBe(false);
    expect(status.reason).toBe("marker-invalid");
  });

  it("returns cache-hit for valid gitlab marker", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

    const cacheDir = path.join(tmpBaseDir, "gitlab", "ucdjs", "ucd-pipelines", "hit-sha");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path.join(cacheDir, ".ucd-cache.json"), JSON.stringify({
      source: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      commitSha: "hit-sha",
      createdAt: new Date().toISOString(),
    }));

    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/hit-ref", () => {
        return HttpResponse.json({ id: "hit-sha" });
      }],
    ]);

    const status = await getRemoteSourceCacheStatus({
      source: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "hit-ref",
    });

    expect(status.cached).toBe(true);
    expect(status.reason).toBe("cache-hit");
  });
});
