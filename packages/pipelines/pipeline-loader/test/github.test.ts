import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { resolveGitHubRef } from "../src/adapters/github";
import { findPipelineFiles, loadPipelineFile } from "../src/loader";

vi.mock("nanotar", () => ({
  parseTarGzip: vi.fn(),
}));

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getBaseRepoCacheDir: vi.fn(),
  };
});

const parseTarGzipMock = vi.mocked(await import("nanotar")).parseTarGzip;
const getBaseRepoCacheDirMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getBaseRepoCacheDir;

describe("github source", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("resolves a GitHub ref to a commit SHA", async () => {
    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/main", () => {
        return HttpResponse.json({ sha: "abc123" });
      }],
    ]);

    await expect(resolveGitHubRef({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    })).resolves.toBe("abc123");
  });

  it("finds pipeline files from a GitHub source", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValueOnce(tmpBaseDir);
    parseTarGzipMock.mockResolvedValueOnce([
      {
        name: "ucdjs-ucd-pipelines-sha-find/pipelines/a.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode("export const a = 1;"),
      },
      {
        name: "ucdjs-ucd-pipelines-sha-find/pipelines/nested/b.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode("export const b = 2;"),
      },
    ] as never);

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/find-ref", () => {
        return HttpResponse.json({ sha: "sha-find" });
      }],
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/tarball/sha-find", () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), { status: 200 });
      }],
    ]);

    const files = await findPipelineFiles({
      source: {
        type: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
        ref: "find-ref",
      },
      patterns: "**/*.ucd-pipeline.ts",
    });

    expect(files).toHaveLength(2);
    expect(parseTarGzipMock).toHaveBeenCalledOnce();
  });

  it("loads a pipeline file via github:// remote URL", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValueOnce(tmpBaseDir);
    parseTarGzipMock.mockResolvedValueOnce([
      {
        name: "ucdjs-ucd-pipelines-sha-load/pipelines/test.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode(`
          export const testPipeline = {
            _type: "pipeline-definition",
            id: "github-test",
            name: "GitHub Test",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `),
      },
    ] as never);

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/load-ref", () => {
        return HttpResponse.json({ sha: "sha-load" });
      }],
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/tarball/sha-load", () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), { status: 200 });
      }],
    ]);

    const result = await loadPipelineFile("github://ucdjs/ucd-pipelines?ref=load-ref&path=pipelines/test.ucd-pipeline.ts");

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("github-test");
  });

  it("uses validated cache and skips archive download", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

    const cacheDir = path.join(tmpBaseDir, "github", "ucdjs", "ucd-pipelines", "cached-sha");
    await mkdir(path.join(cacheDir, "pipelines"), { recursive: true });

    await writeFile(path.join(cacheDir, ".ucd-cache.json"), JSON.stringify({
      source: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      commitSha: "cached-sha",
      createdAt: new Date().toISOString(),
    }));

    await writeFile(path.join(cacheDir, "pipelines", "cached.ucd-pipeline.ts"), "export const a = 1;");

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/cached-ref", () => {
        return HttpResponse.json({ sha: "cached-sha" });
      }],
    ]);

    const files = await findPipelineFiles({
      source: {
        type: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
        ref: "cached-ref",
      },
      patterns: "**/*.ucd-pipeline.ts",
    });

    expect(files).toHaveLength(1);
    expect(parseTarGzipMock).not.toHaveBeenCalled();
  });
});
