import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { resolveGitHubRef } from "../src/adapters/github";
import { discoverPipelineFiles } from "../src/discover";
import { materializePipelineLocator } from "../src/materialize";

vi.mock("@ucdjs/env", async () => {
  const actual = await vi.importActual("@ucdjs/env");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs/env")).getUcdConfigPath;

describe("github locator", () => {
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

  it("materializes and discovers files from a cached GitHub locator", async () => {
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
                commitSha: "sha-main",
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

    const materialized = await materializePipelineLocator({
      kind: "remote",
      provider: "github",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
      path: "pipelines",
    });

    expect(materialized.issues).toEqual([]);
    expect(materialized.repositoryPath).toBeTruthy();

    const discovered = await discoverPipelineFiles({
      repositoryPath: materialized.repositoryPath!,
      origin: materialized.origin,
    });

    expect(discovered.issues).toEqual([]);
    expect(discovered.files).toHaveLength(2);
    expect(discovered.files.map((file) => file.relativePath).sort()).toEqual([
      "a.ucd-pipeline.ts",
      "nested/b.ucd-pipeline.ts",
    ]);
  });
});
