import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { downloadGitHubRepo, resolveGitHubRef } from "../src/cache/github";
import { findPipelineFiles, loadPipelineFile } from "../src/loader";

vi.mock("nanotar", () => ({
  parseTarGzip: vi.fn(),
}));

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getRepositoryCacheDir: vi.fn(),
  };
});

const parseTarGzipMock = vi.mocked(await import("nanotar")).parseTarGzip;
const getRepositoryCacheDirMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getRepositoryCacheDir;

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

  it("throws when resolving a GitHub ref fails", async () => {
    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/main", () => {
        return new HttpResponse("rate limited", { status: 429, statusText: "Too Many Requests" });
      }],
    ]);

    await expect(resolveGitHubRef({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    })).rejects.toThrow("GitHub API error: 429 Too Many Requests");
  });

  it("downloads and extracts a GitHub repo archive", async () => {
    const tmpCacheDir = await testdir();
    getRepositoryCacheDirMock.mockReturnValueOnce(tmpCacheDir);
    parseTarGzipMock.mockResolvedValueOnce([
      {
        name: "ucdjs-ucd-pipelines-abc123/pipelines/a.ucd-pipeline.ts",
        type: "file",
        data: new TextEncoder().encode("export const a = 1;"),
      },
      {
        name: "ucdjs-ucd-pipelines-abc123/README.md",
        type: "file",
        data: new TextEncoder().encode("readme"),
      },
    ] as never);

    mockFetch([
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/commits/main", () => {
        return HttpResponse.json({ sha: "abc123" });
      }],
      ["GET", "https://api.github.com/repos/ucdjs/ucd-pipelines/tarball/abc123", () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), { status: 200 });
      }],
    ]);

    const cacheDir = await downloadGitHubRepo({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(cacheDir).toContain("github");
    expect(parseTarGzipMock).toHaveBeenCalledOnce();
  });

  it("finds pipeline files from a GitHub source", async () => {
    const tmpCacheDir = await testdir();
    getRepositoryCacheDirMock.mockReturnValueOnce(tmpCacheDir);
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
      {
        name: "ucdjs-ucd-pipelines-sha-find/README.md",
        type: "file",
        data: new TextEncoder().encode("readme"),
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
    expect(files.some((p) => p.endsWith("pipelines/a.ucd-pipeline.ts"))).toBe(true);
    expect(files.some((p) => p.endsWith("pipelines/nested/b.ucd-pipeline.ts"))).toBe(true);
  });

  it("loads a pipeline file via github:// remote URL", async () => {
    const tmpCacheDir = await testdir();
    getRepositoryCacheDirMock.mockReturnValueOnce(tmpCacheDir);
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
    expect(result.exportNames).toEqual(["testPipeline"]);
  });
});
