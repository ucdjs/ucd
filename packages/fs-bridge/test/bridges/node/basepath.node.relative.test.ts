import NodeFileSystemBridge from "#internal:bridge/node";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { assertCapability } from "../../../src";

describe("node bridge - relative basePath scenarios", () => {
  describe("relative basePath with relative input", () => {
    it("should resolve relative paths correctly", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("file.txt");
      expect(content).toBe("content");
    });

    it("should resolve nested relative paths", async () => {
      const testDir = await testdir({
        "v16.0.0": {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

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
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("subdir/../file.txt");
      expect(content).toBe("root content");
    });
  });

  describe("relative basePath with absolute input (virtual filesystem)", () => {
    it("should treat absolute input as relative", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Absolute path should be treated as relative (virtual filesystem boundary)
      const content = await bridge.read("/file.txt");
      expect(content).toBe("content");
    });

    it("should treat absolute nested path as relative", async () => {
      const testDir = await testdir({
        "v16.0.0": {
          "file.txt": "content",
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("/v16.0.0/file.txt");
      expect(content).toBe("content");
    });
  });

  describe("relative basePath edge cases", () => {
    it("should handle root reference", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists("/");
      expect(exists).toBe(true);
    });

    it("should handle current directory reference", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists(".");
      expect(exists).toBe(true);
    });

    it("should handle empty path", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const exists = await bridge.exists("");
      expect(exists).toBe(true);
    });
  });

  describe("all bridge methods with relative basePath", () => {
    it("should work with read", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const content = await bridge.read("file.txt");
      expect(content).toBe("content");
    });

    it("should work with write", async () => {
      const testDir = await testdir();
      const bridge = NodeFileSystemBridge({ basePath: testDir });
      assertCapability(bridge, "write");

      await bridge.write("file.txt", "new content");
      const content = await bridge.read("file.txt");
      expect(content).toBe("new content");
    });

    it("should work with exists", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      expect(await bridge.exists("file.txt")).toBe(true);
      expect(await bridge.exists("missing.txt")).toBe(false);
    });

    it("should work with listdir", async () => {
      const testDir = await testdir({
        "file1.txt": "content1",
        "file2.txt": "content2",
        "subdir": {},
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      const entries = await bridge.listdir("");
      expect(entries).toHaveLength(3);
    });

    it("should work with mkdir", async () => {
      const testDir = await testdir();
      const bridge = NodeFileSystemBridge({ basePath: testDir });
      assertCapability(bridge, "mkdir");

      await bridge.mkdir("newdir");
      expect(await bridge.exists("newdir")).toBe(true);
    });

    it("should work with rm", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });
      assertCapability(bridge, "rm");

      await bridge.rm("file.txt");
      expect(await bridge.exists("file.txt")).toBe(false);
    });
  });
});
