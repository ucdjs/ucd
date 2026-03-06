import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { resolveGitHubRef } from "../src/adapters/github";
import { findPipelineFiles, loadPipelineFile } from "../src/loader";

vi.mock("@ucdjs-internal/shared/config", async () => {
  const actual = await vi.importActual("@ucdjs-internal/shared/config");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs-internal/shared/config")).getUcdConfigPath;

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
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            "find-ref": {
              ".ucd-cache.json": JSON.stringify({
                source: "github",
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
    getUcdConfigPathMock.mockReturnValueOnce(tmpBaseDir);

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
  });

  it("loads a pipeline file via github:// remote URL", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            "load-ref": {
              ".ucd-cache.json": JSON.stringify({
                source: "github",
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
                    id: "github-test",
                    name: "GitHub Test",
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
    getUcdConfigPathMock.mockReturnValueOnce(tmpBaseDir);

    const result = await loadPipelineFile("github://ucdjs/ucd-pipelines?ref=load-ref&path=pipelines/test.ucd-pipeline.ts");

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0]?.id).toBe("github-test");
  });

  it("uses validated cache and skips archive download", async () => {
    const tmpBaseDir = await testdir({
      github: {
        ucdjs: {
          "ucd-pipelines": {
            "cached-ref": {
              ".ucd-cache.json": JSON.stringify({
                source: "github",
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
    getUcdConfigPathMock.mockReturnValue(tmpBaseDir);

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
  });
});
