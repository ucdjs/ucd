import { HttpResponse, mockFetch } from "#test-utils/msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { resolveGitLabRef } from "../src/adapters/gitlab";
import { materializePipelineLocator } from "../src/materialize";

vi.mock("@ucdjs/env", async () => {
  const actual = await vi.importActual("@ucdjs/env");
  return {
    ...actual,
    getUcdConfigPath: vi.fn(),
  };
});

const getUcdConfigPathMock = vi.mocked(await import("@ucdjs/env")).getUcdConfigPath;

describe("gitlab locator", () => {
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

  it("returns a cache-miss issue for an uncached GitLab locator", async () => {
    const tmpBaseDir = await testdir();
    getUcdConfigPathMock.mockReturnValueOnce(tmpBaseDir);

    const materialized = await materializePipelineLocator({
      kind: "remote",
      provider: "gitlab",
      owner: "ucdjs",
      repo: "ucd-pipelines",
      ref: "main",
    });

    expect(materialized.repositoryPath).toBeUndefined();
    expect(materialized.issues).toHaveLength(1);
    expect(materialized.issues[0]?.code).toBe("CACHE_MISS");
    expect(materialized.issues[0]?.scope).toBe("repository");
  });
});
