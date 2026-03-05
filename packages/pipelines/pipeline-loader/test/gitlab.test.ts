import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { resolveGitLabRef } from "../src/adapters/gitlab";
import { findPipelineFiles, loadPipelineFile } from "../src/loader";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getBaseRepoCacheDir: vi.fn(),
  };
});

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
    const tmpBaseDir = await testdir({
      gitlab: {
        ucdjs: {
          "ucd-pipelines": {
            "find-ref": {
              ".ucd-cache.json": JSON.stringify({
                source: "gitlab",
                owner: "ucdjs",
                repo: "ucd-pipelines",
                ref: "find-ref",
                commitSha: "sha-find",
                syncedAt: "2026-01-01T00:00:00.000Z",
              }),
              "pipelines": {
                "a.ucd-pipeline.ts": "export const a = 1;",
                "nested": {
                  "b.ucd-pipeline.ts": "export const b = 2;",
                },
              },
            },
          },
        },
      },
    });
    getBaseRepoCacheDirMock.mockReturnValueOnce(tmpBaseDir);

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
  });

  it("loads a pipeline file via gitlab:// remote URL", async () => {
    const tmpBaseDir = await testdir({
      gitlab: {
        ucdjs: {
          "ucd-pipelines": {
            "load-ref": {
              ".ucd-cache.json": JSON.stringify({
                source: "gitlab",
                owner: "ucdjs",
                repo: "ucd-pipelines",
                ref: "load-ref",
                commitSha: "sha-load",
                syncedAt: "2026-01-01T00:00:00.000Z",
              }),
              "pipelines": {
                "test.ucd-pipeline.ts": `
                  export const testPipeline = {
                    _type: "pipeline-definition",
                    id: "gitlab-test",
                    name: "GitLab Test",
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
    getBaseRepoCacheDirMock.mockReturnValueOnce(tmpBaseDir);

    const result = await loadPipelineFile("gitlab://ucdjs/ucd-pipelines?ref=load-ref&path=pipelines/test.ucd-pipeline.ts");

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("gitlab-test");
  });

  it("uses validated cache and skips archive download", async () => {
    const tmpBaseDir = await testdir({
      gitlab: {
        ucdjs: {
          "ucd-pipelines": {
            "cached-ref": {
              ".ucd-cache.json": JSON.stringify({
                source: "gitlab",
                owner: "ucdjs",
                repo: "ucd-pipelines",
                ref: "cached-ref",
                commitSha: "cached-sha",
                syncedAt: "2026-01-01T00:00:00.000Z",
              }),
              "pipelines": {
                "cached.ucd-pipeline.ts": "export const a = 1;",
              },
            },
          },
        },
      },
    });
    getBaseRepoCacheDirMock.mockReturnValue(tmpBaseDir);

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
  });
});
