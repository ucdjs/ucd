import { readFile } from "node:fs/promises";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { downloadGitLabRepo, resolveGitLabRef } from "../src/cache/gitlab";
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
const realParseTarGzip = (await vi.importActual<typeof import("nanotar")>("nanotar")).parseTarGzip;
const getRepositoryCacheDirMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getRepositoryCacheDir;

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

  it("throws when resolving a GitLab ref fails", async () => {
    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/main", () => {
        return new HttpResponse("rate limited", { status: 429, statusText: "Too Many Requests" });
      }],
    ]);

    await expect(resolveGitLabRef({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    })).rejects.toThrow("GitLab API error: 429 Too Many Requests");
  });

  it("downloads and extracts a GitLab repo archive", async () => {
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
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/main", () => {
        return HttpResponse.json({ id: "abc123" });
      }],
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/archive.tar.gz?sha=abc123", () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), { status: 200 });
      }],
    ]);

    const cacheDir = await downloadGitLabRepo({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(cacheDir).toContain("gitlab");
    expect(parseTarGzipMock).toHaveBeenCalledOnce();
  });

  it("finds pipeline files from a GitLab source", async () => {
    const tmpCacheDir = await testdir();
    getRepositoryCacheDirMock.mockReturnValueOnce(tmpCacheDir);
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
      {
        name: "repo-sha-find/README.md",
        type: "file",
        data: new TextEncoder().encode("readme"),
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
    expect(files.some((p) => p.endsWith("pipelines/a.ucd-pipeline.ts"))).toBe(true);
    expect(files.some((p) => p.endsWith("pipelines/nested/b.ucd-pipeline.ts"))).toBe(true);
  });

  it("loads a pipeline file via gitlab:// remote URL", async () => {
    const tmpCacheDir = await testdir();
    getRepositoryCacheDirMock.mockReturnValueOnce(tmpCacheDir);
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
    expect(result.exportNames).toEqual(["testPipeline"]);
  });

  it("parses and extracts a real GitLab tar.gz fixture", async () => {
    const tmpCacheDir = await testdir();
    getRepositoryCacheDirMock.mockReturnValueOnce(tmpCacheDir);
    parseTarGzipMock.mockImplementationOnce(realParseTarGzip);

    const archiveFixture = await readFile(new URL("./fixtures/ucdjs-pipelines-gitlab-82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd-82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd.tar.gz", import.meta.url));

    mockFetch([
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/commits/82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd", () => {
        return HttpResponse.json({ id: "82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd" });
      }],
      ["GET", "https://gitlab.com/api/v4/projects/ucdjs%2Fucd-pipelines/repository/archive.tar.gz?sha=82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd", () => {
        return new HttpResponse(archiveFixture, { status: 200 });
      }],
    ]);

    const cacheDir = await downloadGitLabRepo({
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "82ecdea1b36d26bd74a1e3d66da1ff026cf5a6dd",
    });

    const files = await findPipelineFiles({
      source: { type: "local", cwd: cacheDir },
    });

    expect(files.length).toEqual(1);
  });
});
