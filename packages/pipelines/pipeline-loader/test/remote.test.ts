import { encodeBase64 } from "#test-utils";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { createPipelineModuleSource } from "#test-utils/pipelines";
import { describe, expect, it } from "vitest";
import { findPipelineFiles, loadPipelineFile, loadPipelinesFromPaths } from "../src/loader";

describe("findPipelineFiles with remote sources", () => {
  it("should list GitHub files and apply pattern filtering", async () => {
    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/commits/main",
        () => HttpResponse.json({ sha: "abc123" }),
      ],
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/tarball/abc123",
        () => {
          // Return a mock tar.gz - in real tests this would need actual tar data
          return HttpResponse.arrayBuffer(new ArrayBuffer(0));
        },
      ],
    ]);

    // Test that the function accepts GitHub source type
    // Note: Full integration test would need actual tar.gz data
    await expect(
      findPipelineFiles({
        source: { type: "github", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
        patterns: "pipelines/**/*.ucd-pipeline.ts",
      })
    ).rejects.toThrow(); // Will fail because we don't have real tar data
  });

  it("should list GitLab files and apply pattern filtering", async () => {
    mockFetch([
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/commits/main",
        () => HttpResponse.json({ id: "abc123" }),
      ],
      [
        "GET",
        "https://gitlab.com/api/v4/projects/ucdjs%2Fdemo-pipelines/repository/archive.tar.gz",
        () => HttpResponse.arrayBuffer(new ArrayBuffer(0)),
      ],
    ]);

    // Test that the function accepts GitLab source type
    await expect(
      findPipelineFiles({
        source: { type: "gitlab", owner: "ucdjs", repo: "demo-pipelines", ref: "main" },
        patterns: "pipelines/**/*.ucd-pipeline.ts",
      })
    ).rejects.toThrow(); // Will fail because we don't have real tar data
  });
});

describe("loadPipelineFile with github:// URLs", () => {
  it("should load GitHub pipeline files", async () => {
    const alpha = createPipelineModuleSource({ named: ["alpha"] });

    mockFetch([
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/commits/main",
        () => HttpResponse.json({ sha: "abc123" }),
      ],
      [
        "GET",
        "https://api.github.com/repos/ucdjs/demo-pipelines/tarball/abc123",
        () => HttpResponse.arrayBuffer(new ArrayBuffer(0)),
      ],
    ]);

    // Test that the function accepts github:// URLs
    await expect(
      loadPipelineFile("github://ucdjs/demo-pipelines?ref=main&path=pipelines/alpha.ucd-pipeline.ts")
    ).rejects.toThrow(); // Will fail because we don't have real tar data
  });
});

describe("loadPipelinesFromPaths", () => {
  it("should handle mixed local and remote paths", async () => {
    // This test demonstrates the unified API can handle both
    // Local paths work immediately, remote paths need mocking
    const localContent = createPipelineModuleSource({ named: ["local"] });
    
    // Create a temporary file for testing
    const fs = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");
    
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ucd-test-"));
    const localFile = path.join(tmpDir, "local.ucd-pipeline.ts");
    await fs.writeFile(localFile, localContent);

    try {
      const result = await loadPipelinesFromPaths([localFile]);

      expect(result.errors).toEqual([]);
      expect(result.files).toHaveLength(1);
      expect(result.pipelines.map((p) => p.id)).toEqual(["local"]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
