import { resolve } from "node:path";
import NodeFileSystemBridge from "#internal:bridge/node";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("boundary enforcement", () => {
  describe("absolute basePath boundary", () => {
    it("should enforce boundary for absolute basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      // Should prevent traversal outside absolute basePath
      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../outside.txt"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow operations within absolute basePath", async () => {
      const testDir = await testdir({
        subdir: {
          "file.txt": "content",
        },
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const content = await bridge.read("subdir/file.txt");
      expect(content).toBe("content");
    });

    it("should be independent of current working directory", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      // Change CWD shouldn't affect boundary enforcement
      const originalCwd = process.cwd();
      try {
        process.chdir("/tmp");
        // Should still prevent traversal
        await expect(
          bridge.read("../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("relative basePath boundary", () => {
    it("should enforce boundary for relative basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Should prevent traversal outside relative basePath
      await expect(
        bridge.read("../outside.txt"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow operations within relative basePath", async () => {
      const testDir = await testdir({
        subdir: {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("subdir/file.txt");
      expect(content).toBe("content");
    });
  });

  describe("boundary edge cases", () => {
    it("should prevent traversal at boundary root", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try to go up from root
      await expect(
        bridge.read(".."),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow traversal within nested directories", async () => {
      const testDir = await testdir({
        level1: {
          "level2": {
            "file.txt": "level2 content",
          },
          "file.txt": "level1 content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Traverse up one level but stay within basePath
      const content = await bridge.read("level1/level2/../file.txt");
      expect(content).toBe("level1 content");
    });
  });
});
