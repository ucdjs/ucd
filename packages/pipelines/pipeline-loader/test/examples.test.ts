import { readFile } from "node:fs/promises";
import path from "node:path";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { discoverPipelineFiles } from "../src/discover";
import {
  checkRemoteLocatorUpdates,
  ensureRemoteLocator,
  getRemoteSourceCacheStatus,
  loadPipelineFile,
  loadPipelinesFromPaths,
  materializePipelineLocator,
  parsePipelineLocator,
  parseRemoteSourceUrl,
} from "../src/index";

vi.mock("@ucdjs/env", async () => {
  const actual = await vi.importActual("@ucdjs/env");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs/env")).getUcdConfigPath;

const githubArchiveFixture = new URL("./fixtures/ucdjs-ucd-pipelines-a577a07.tar.gz", import.meta.url);
const gitlabArchiveFixture = new URL(
  "./fixtures/ucdjs-pipelines-gitlab-82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd-82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd.tar.gz",
  import.meta.url,
);

function createCacheMarker(provider: "github" | "gitlab", ref: string, commitSha: string) {
  return JSON.stringify({
    source: provider,
    owner: "ucdjs",
    repo: "ucd-pipelines",
    ref,
    commitSha,
    syncedAt: "2026-01-01T00:00:00.000Z",
  });
}

describe("pipeline-loader examples", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("parses local and remote locators", () => {
    expect(parsePipelineLocator("./pipelines")).toEqual({
      kind: "local",
      path: "./pipelines",
    });

    expect(parsePipelineLocator("github://ucdjs/ucd-pipelines?ref=main&path=src")).toEqual({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src",
    });

    expect(parseRemoteSourceUrl("gitlab://ucdjs/ucd-pipelines?ref=main")).toEqual({
      kind: "remote",
      provider: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: undefined,
    });
  });

  it("materializes and loads a local file locator", async () => {
    const dir = await testdir({
      pipelines: {
        "simple.ucd-pipeline.ts": /* ts */`
          export const simple = {
            _type: "pipeline-definition",
            id: "simple",
            name: "Simple",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `,
      },
    });

    const materialized = await materializePipelineLocator({
      kind: "local",
      path: path.join(dir, "pipelines/simple.ucd-pipeline.ts"),
    });

    expect(materialized.issues).toEqual([]);
    expect(materialized.relativePath).toBe("simple.ucd-pipeline.ts");

    const loaded = await loadPipelineFile(materialized.filePath!);

    expect(loaded.filePath).toBe(materialized.filePath);
    expect(loaded.exportNames).toEqual(["simple"]);
    expect(loaded.pipelines.map((pipeline) => pipeline.id)).toEqual(["simple"]);
  });

  it("materializes, discovers, and loads a local directory", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": /* ts */`
          export const alpha = {
            _type: "pipeline-definition",
            id: "alpha",
            name: "Alpha",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `,
        "nested": {
          "beta.ucd-pipeline.ts": /* ts */`
            export const beta = {
              _type: "pipeline-definition",
              id: "beta",
              name: "Beta",
              versions: ["16.0.0"],
              inputs: [],
              routes: [],
            };
          `,
        },
      },
    });

    const materialized = await materializePipelineLocator({
      kind: "local",
      path: path.join(dir, "pipelines"),
    });

    expect(materialized.issues).toEqual([]);
    expect(materialized.repositoryPath).toBe(path.join(dir, "pipelines"));

    const discovered = await discoverPipelineFiles({
      repositoryPath: materialized.repositoryPath!,
    });

    expect(discovered.issues).toEqual([]);
    expect(discovered.files.map((file) => file.relativePath).sort()).toEqual([
      "alpha.ucd-pipeline.ts",
      "nested/beta.ucd-pipeline.ts",
    ]);

    const loaded = await loadPipelinesFromPaths(discovered.files.map((file) => file.filePath));

    expect(loaded.issues).toEqual([]);
    expect(loaded.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("materializes, discovers, and loads a cached GitHub directory locator", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            main: {
              ".ucd-cache.json": createCacheMarker("github", "main", "sha-main"),
              "src": {
                "alpha.ucd-pipeline.ts": /* ts */`
                  export const alpha = {
                    _type: "pipeline-definition",
                    id: "alpha",
                    name: "Alpha",
                    versions: ["16.0.0"],
                    inputs: [],
                    routes: [],
                  };
                `,
                "nested": {
                  "beta.ucd-pipeline.ts": /* ts */`
                    export const beta = {
                      _type: "pipeline-definition",
                      id: "beta",
                      name: "Beta",
                      versions: ["16.0.0"],
                      inputs: [],
                      routes: [],
                    };
                  `,
                },
              },
            },
          },
        },
      },
    });
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const materialized = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src",
    });

    expect(materialized.issues).toEqual([]);
    expect(materialized.origin).toEqual({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src",
    });

    const discovered = await discoverPipelineFiles({
      repositoryPath: materialized.repositoryPath!,
      origin: materialized.origin,
    });

    expect(discovered.issues).toEqual([]);
    expect(discovered.files[0]?.origin?.provider).toBe("github");
    expect(discovered.files.map((file) => file.relativePath).sort()).toEqual([
      "alpha.ucd-pipeline.ts",
      "nested/beta.ucd-pipeline.ts",
    ]);

    const loaded = await loadPipelinesFromPaths(discovered.files.map((file) => file.filePath));

    expect(loaded.issues).toEqual([]);
    expect(loaded.pipelines.map((pipeline) => pipeline.id).sort()).toEqual(["alpha", "beta"]);
  });

  it("materializes and loads one cached remote file locator", async () => {
    const tmpBaseDir = await testdir({
      gitlab: {
        ucdjs: {
          "ucd-pipelines": {
            main: {
              ".ucd-cache.json": createCacheMarker("gitlab", "main", "sha-main"),
              "src": {
                "simple.ucd-pipeline.ts": /* ts */`
                  export const simple = {
                    _type: "pipeline-definition",
                    id: "simple",
                    name: "Simple",
                    versions: ["16.0.0"],
                    inputs: [],
                    routes: [],
                  };
                `,
              },
            },
          },
        },
      },
    });
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const materialized = await materializePipelineLocator({
      kind: "remote",
      provider: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src/simple.ucd-pipeline.ts",
    });

    expect(materialized.issues).toEqual([]);
    expect(materialized.relativePath).toBe("simple.ucd-pipeline.ts");

    const loaded = await loadPipelineFile(materialized.filePath!);

    expect(loaded.pipelines.map((pipeline) => pipeline.id)).toEqual(["simple"]);
  });

  it("returns a stable cache-miss issue for an uncached remote locator", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const materialized = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(materialized.repositoryPath).toBeUndefined();
    expect(materialized.issues).toHaveLength(1);
    expect(materialized.issues[0]).toMatchObject({
      code: "CACHE_MISS",
      scope: "repository",
    });
  });

  it("checks for remote updates against the cached SHA", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            main: {
              ".ucd-cache.json": createCacheMarker("github", "main", "sha-current"),
            },
          },
        },
      },
    });
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/main", () => {
        return HttpResponse.json({ sha: "sha-next" });
      }],
    ]);

    const result = await checkRemoteLocatorUpdates({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(result).toMatchObject({
      hasUpdate: true,
      currentSha: "sha-current",
      remoteSha: "sha-next",
    });
  });

  it("syncs a GitHub remote source, then materializes and discovers it from cache", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);
    const archiveBuffer = await readFile(githubArchiveFixture);

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/main") {
        return HttpResponse.json({ sha: "a577a07" });
      }

      if (url === "https://api.github.com/repos/ucdjs/ucd-pipelines/tarball/a577a07") {
        return new HttpResponse(archiveBuffer);
      }

      return new HttpResponse("not found", { status: 404, statusText: "Not Found" });
    }));

    const syncResult = await ensureRemoteLocator({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(syncResult).toMatchObject({
      success: true,
      updated: true,
      newSha: "a577a07",
    });

    const cacheStatus = await getRemoteSourceCacheStatus({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(cacheStatus.cached).toBe(true);
    expect(cacheStatus.commitSha).toBe("a577a07");

    const materialized = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src",
    });

    const discovered = await discoverPipelineFiles({
      repositoryPath: materialized.repositoryPath!,
      origin: materialized.origin,
    });
    expect(discovered.files.map((file) => file.relativePath)).toEqual(["simple.ucd-pipeline.ts"]);
    expect(discovered.files[0]?.origin).toEqual({
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src/simple.ucd-pipeline.ts",
    });
  });

  it("syncs a GitLab remote source and stores it in the local cache", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);
    const archiveBuffer = await readFile(gitlabArchiveFixture);

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/main") {
        return HttpResponse.json({ id: "82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd" });
      }

      if (url === "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/archive.tar.gz?sha=82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd") {
        return new HttpResponse(archiveBuffer);
      }

      return new HttpResponse("not found", { status: 404, statusText: "Not Found" });
    }));

    const syncResult = await ensureRemoteLocator({
      provider: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(syncResult).toMatchObject({
      success: true,
      updated: true,
      newSha: "82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd",
    });

    const cacheStatus = await getRemoteSourceCacheStatus({
      provider: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(cacheStatus).toMatchObject({
      cached: true,
      commitSha: "82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd",
    });
  });
});
