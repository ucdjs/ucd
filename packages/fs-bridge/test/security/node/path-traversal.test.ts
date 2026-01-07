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

  describe("recursive listdir security", () => {
    it("should prevent traversal via malicious directory names in recursive listdir", async () => {
      // Note: On most filesystems, creating a directory named "../" is not allowed,
      // but we test the path resolution logic to ensure it would be caught
      const testDir = await testdir({
        "safe-dir": {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Attempt to access with traversal in the listdir path itself
      await expect(
        bridge.listdir("../", true),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.listdir("safe-dir/../../", true),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent traversal via encoded path components in recursive listdir", async () => {
      const testDir = await testdir({
        normal: {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // URL-encoded traversal attempts
      await expect(
        bridge.listdir("%2e%2e/", true),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.listdir("normal/%2e%2e/%2e%2e/", true),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should safely handle recursive listdir on legitimate nested structure", async () => {
      const testDir = await testdir({
        level1: {
          "level2": {
            "level3": {
              "deep-file.txt": "deep content",
            },
            "mid-file.txt": "mid content",
          },
          "top-file.txt": "top content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Should work - legitimate nested structure
      const entries = await bridge.listdir("", true);
      expect(entries).toHaveLength(1);

      const level1 = entries[0];
      expect(level1?.name).toBe("level1");
      expect(level1?.type).toBe("directory");

      if (level1?.type === "directory") {
        expect(level1.children).toHaveLength(2); // level2 dir + top-file.txt
      }
    });
  });
});
