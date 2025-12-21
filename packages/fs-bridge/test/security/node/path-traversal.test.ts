import NodeFileSystemBridge from "#internal:bridge/node";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("path traversal security", () => {
  describe("node bridge - path traversal prevention", () => {
    it("should prevent directory traversal attacks that go outside basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Attempt to traverse outside basePath
      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../../../root/.ssh/id_rsa"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../outside/file.txt"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow upward traversal that stays within basePath", async () => {
      const testDir = await testdir({
        "subdir": {
          "file.txt": "content",
        },
        "file.txt": "root content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // This should work - traverses up but stays within basePath
      const content = await bridge.read("subdir/../file.txt");
      expect(content).toBe("root content");
    });

    it("should prevent traversal with multiple levels going outside", async () => {
      const testDir = await testdir({
        deep: {
          nested: {
            "file.txt": "content",
          },
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Multiple ../ that go outside
      await expect(
        bridge.read("deep/nested/../../../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow traversal within nested directories", async () => {
      const testDir = await testdir({
        "v16.0.0": {
          "file.txt": "v16 content",
        },
        "v15.1.0": {
          "file.txt": "v15 content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Traverse from v16.0.0 to v15.1.0 - should work
      const content = await bridge.read("v16.0.0/../v15.1.0/file.txt");
      expect(content).toBe("v15 content");
    });

    it("should prevent traversal from root of basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try to go up from root
      await expect(
        bridge.read("../outside.txt"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("boundary enforcement", () => {
    it("should enforce boundary for absolute basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Even with absolute basePath, should prevent traversal
      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should enforce boundary for relative basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Should prevent traversal outside relative basePath
      await expect(
        bridge.read("../outside.txt"),
      ).rejects.toThrow(PathTraversalError);
    });
  });
});
