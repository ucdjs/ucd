import { resolve } from "node:path";
import NodeFileSystemBridge from "#internal:bridge/node";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { assertCapability } from "../../../src";

describe("node bridge - absolute basePath scenarios", () => {
  describe("absolute basePath with relative input", () => {
    it("should resolve relative paths correctly", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const content = await bridge.read("file.txt");
      expect(content).toBe("content");
    });

    it("should resolve nested relative paths", async () => {
      const testDir = await testdir({
        "v16.0.0": {
          "file.txt": "content",
        },
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const content = await bridge.read("v16.0.0/file.txt");
      expect(content).toBe("content");
    });

    it("should allow upward traversal within basePath", async () => {
      const testDir = await testdir({
        "subdir": {
          "file.txt": "subdir content",
        },
        "file.txt": "root content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const content = await bridge.read("subdir/../file.txt");
      expect(content).toBe("root content");
    });

    it("should allow version directory traversal", async () => {
      const testDir = await testdir({
        "v16.0.0": {
          "file.txt": "v16 content",
        },
        "v15.1.0": {
          "file.txt": "v15 content",
        },
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const content = await bridge.read("v16.0.0/../v15.1.0/file.txt");
      expect(content).toBe("v15 content");
    });
  });

  describe("absolute basePath with absolute input", () => {
    it("should handle absolute input within basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      // Absolute path within basePath should work
      const content = await bridge.read(`${absoluteBasePath}/file.txt`);
      expect(content).toBe("content");
    });

    it("should treat absolute input outside as relative (virtual filesystem)", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      // Absolute path should be treated as relative (virtual filesystem boundary)
      const content = await bridge.read("/file.txt");
      expect(content).toBe("content");
    });
  });

  describe("absolute basePath edge cases", () => {
    it("should handle root reference", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const exists = await bridge.exists("/");
      expect(exists).toBe(true);
    });

    it("should handle current directory reference", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const exists = await bridge.exists(".");
      expect(exists).toBe(true);
    });

    it("should be independent of current working directory", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const originalCwd = process.cwd();
      try {
        // Change CWD
        process.chdir("/tmp");

        // Should still work with absolute basePath
        const content = await bridge.read("file.txt");
        expect(content).toBe("content");
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("all bridge methods with absolute basePath", () => {
    it("should work with read", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const content = await bridge.read("file.txt");
      expect(content).toBe("content");
    });

    it("should work with write", async () => {
      const testDir = await testdir();
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });
      assertCapability(bridge, "write");

      await bridge.write("file.txt", "new content");
      const content = await bridge.read("file.txt");
      expect(content).toBe("new content");
    });

    it("should work with exists", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      expect(await bridge.exists("file.txt")).toBe(true);
      expect(await bridge.exists("missing.txt")).toBe(false);
    });

    it("should work with listdir", async () => {
      const testDir = await testdir({
        "file1.txt": "content1",
        "file2.txt": "content2",
        "subdir": {},
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

      const entries = await bridge.listdir("");
      expect(entries).toHaveLength(3);
    });

    it("should work with mkdir", async () => {
      const testDir = await testdir();
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });
      assertCapability(bridge, "mkdir");

      await bridge.mkdir("newdir");
      expect(await bridge.exists("newdir")).toBe(true);
    });

    it("should work with rm", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const absoluteBasePath = resolve(testDir);
      const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });
      assertCapability(bridge, "rm");

      await bridge.rm("file.txt");
      expect(await bridge.exists("file.txt")).toBe(false);
    });
  });
});
