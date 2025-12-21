import NodeFileSystemBridge from "#internal:bridge/node";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("edge cases", () => {
  describe("empty paths", () => {
    it("should handle empty input path", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Empty path should resolve to basePath
      const exists = await bridge.exists("");
      expect(exists).toBe(true);
    });

    it("should handle whitespace-only paths", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Whitespace should resolve to basePath
      const exists = await bridge.exists("   ");
      expect(exists).toBe(true);
    });
  });

  describe("root and current directory", () => {
    it("should resolve root to basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Root should resolve to basePath
      const exists = await bridge.exists("/");
      expect(exists).toBe(true);
    });

    it("should resolve current directory to basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Current directory should resolve to basePath
      const exists = await bridge.exists(".");
      expect(exists).toBe(true);

      const exists2 = await bridge.exists("./");
      expect(exists2).toBe(true);
    });
  });

  describe("parent directory", () => {
    it("should handle parent directory within basePath", async () => {
      const testDir = await testdir({
        subdir: {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // From subdir, .. should resolve to basePath
      const exists = await bridge.exists("subdir/..");
      expect(exists).toBe(true);
    });

    it("should prevent parent directory outside basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // From root, .. should be outside basePath
      await expect(
        bridge.read(".."),
      ).rejects.toThrow();
    });
  });

  describe("upward traversal within basePath", () => {
    it("should allow upward traversal that stays within basePath", async () => {
      const testDir = await testdir({
        "subdir": {
          "file.txt": "subdir content",
        },
        "file.txt": "root content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("subdir/../file.txt");
      expect(content).toBe("root content");
    });

    it("should prevent upward traversal that goes outside basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow();
    });
  });

  describe("path separators", () => {
    it("should normalize multiple slashes", async () => {
      const testDir = await testdir({
        path: {
          to: {
            "file.txt": "content",
          },
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("path///to///file.txt");
      expect(content).toBe("content");
    });

    it("should handle trailing slashes", async () => {
      const testDir = await testdir({
        dir: {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content1 = await bridge.read("dir/file.txt");
      expect(content1).toBe("content");

      await expect(
        bridge.read("dir/file.txt/"),
      ).rejects.toThrow();
    });

    it("should normalize mixed separators", async () => {
      const testDir = await testdir({
        path: {
          to: {
            "file.txt": "content",
          },
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Mix of forward and backslashes (Windows-style)
      const content = await bridge.read("path\\to/file.txt");
      expect(content).toBe("content");
    });
  });

  describe("special characters in paths", () => {
    it("should handle spaces in paths", async () => {
      const testDir = await testdir({
        "My Documents": {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("My Documents/file.txt");
      expect(content).toBe("content");
    });

    it("should handle special characters", async () => {
      const testDir = await testdir({
        "my-app_v2.0": {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("my-app_v2.0/file.txt");
      expect(content).toBe("content");
    });

    it("should handle dotfiles", async () => {
      const testDir = await testdir({
        ".config": {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read(".config/file.txt");
      expect(content).toBe("content");
    });
  });
});
