import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { resolveGitLabRef } from "../src/adapters/gitlab";
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

describe("gitlab source", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("resolves a GitLab ref to a commit SHA", async () => {
    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/main", () => {
        return HttpResponse.json({ id: "abc123" });
      }],
    ]);

    await expect(resolveGitLabRef({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    })).resolves.toBe("abc123");
  });

  it("finds pipeline files from a GitLab source", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValueOnce(tmpBaseDir);
    parseTarGzipMock.mockResolvedValueOnce([
      {
        name: "repo-sha-find/pipelines/a.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode("export const a = 1;"),
      },
      {
        name: "repo-sha-find/pipelines/nested/b.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode("export const b = 2;"),
      },
    ] as never);

    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/find-ref", () => {
        return HttpResponse.json({ id: "sha-find" });
      }],
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/archive.tar.gz?sha=sha-find", () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), { status: 200 });
      }],
    ]);

    const files = await findPipelineFiles({
      source: {
        type: "gitlab",
        owner: "ucdjs",
        repo: "ucd-pipelines",
        ref: "find-ref",
      },
      patterns: "**/*.ucd-pipeline.ts",
    });

    expect(files).toHaveLength(2);
    expect(parseTarGzipMock).toHaveBeenCalledOnce();
  });

  it("loads a pipeline file via gitlab:// remote URL", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValueOnce(tmpBaseDir);
    parseTarGzipMock.mockResolvedValueOnce([
      {
        name: "repo-sha-load/pipelines/test.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode(`
          export const testPipeline = {
            _type: "pipeline-definition",
            id: "gitlab-test",
            name: "GitLab Test",
            versions: ["16.0.0"],
            inputs: [],
            routes: [],
          };
        `),
      },
    ] as never);

    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/load-ref", () => {
        return HttpResponse.json({ id: "sha-load" });
      }],
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/archive.tar.gz?sha=sha-load", () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), { status: 200 });
      }],
    ]);

    const result = await loadPipelineFile("gitlab://ucdjs/ucd-pipelines?ref=load-ref&path=pipelines/test.ucd-pipeline.ts");

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("gitlab-test");
  });

  it("uses validated cache and skips archive download", async () => {
    const tmpBaseDir = await testdir();
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

    const cacheDir = path.join(tmpBaseDir, "gitlab", "ucdjs", "ucd-pipelines", "cached-sha");
    await mkdir(path.join(cacheDir, "pipelines"), { recursive: true });

    await writeFile(path.join(cacheDir, ".ucd-cache.json"), JSON.stringify({
      source: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      commitSha: "cached-sha",
      createdAt: new Date().toISOString(),
    }));

    await writeFile(path.join(cacheDir, "pipelines", "cached.ucd-pipeline.ts"), "export const a = 1;");

    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/cached-ref", () => {
        return HttpResponse.json({ id: "cached-sha" });
      }],
    ]);

    const files = await findPipelineFiles({
      source: {
        type: "gitlab",
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
