import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { materializePipelineLocator } from "../src/materialize";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getUcdConfigPath;

describe("materializePipelineLocator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("materializes a local file locator", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": "",
      },
    });

    const result = await materializePipelineLocator({
      kind: "local",
      path: path.join(dir, "pipelines/alpha.ucd-pipeline.ts"),
    });

    expect(result.issues).toEqual([]);
    expect(result.filePath).toBeTruthy();
    expect(result.repositoryPath).toBeTruthy();
    expect(result.relativePath).toBe("alpha.ucd-pipeline.ts");
  });

  it("materializes a local directory locator", async () => {
    const dir = await testdir({
      pipelines: {
        "alpha.ucd-pipeline.ts": "",
      },
    });

    const result = await materializePipelineLocator({
      kind: "local",
      path: path.join(dir, "pipelines"),
    });

    expect(result.issues).toEqual([]);
    expect(result.repositoryPath).toBe(path.join(dir, "pipelines"));
    expect(result.filePath).toBeUndefined();
  });

  it("materializes a cached remote file locator into a local path", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            main: {
              ".ucd-cache.json": JSON.stringify({
                source: "github",
                owner: "ucdjs",
                repo: "ucd-pipelines",
                ref: "main",
                commitSha: "abc123",
                syncedAt: new Date().toISOString(),
              }),
              "src": {
                "remote.ucd-pipeline.ts": "export const remote = 1;",
              },
            },
          },
        },
      },
    });
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const result = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "src/remote.ucd-pipeline.ts",
    });

    expect(result.issues).toEqual([]);
    expect(result.filePath).toBe(path.normalize(`${tmpBaseDir}/github/ucdjs/ucd-pipelines/main/src/remote.ucd-pipeline.ts`));
    expect(result.origin?.path).toBe("src/remote.ucd-pipeline.ts");
  });

  it("returns a cache-miss issue for an uncached remote locator", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const result = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(result.repositoryPath).toBeUndefined();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("CACHE_MISS");
  });

  it("returns an invalid-locator issue for path traversal", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            main: {
              ".ucd-cache.json": JSON.stringify({
                source: "github",
                owner: "ucdjs",
                repo: "ucd-pipelines",
                ref: "main",
                commitSha: "abc123",
                syncedAt: new Date().toISOString(),
              }),
            },
          },
        },
      },
    });
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

    const result = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "../escape.ts",
    });

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("INVALID_LOCATOR");
  });
});
