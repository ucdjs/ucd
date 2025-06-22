import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBridge from "../../src/fs-bridge/node";

describe("fs-bridge#node", () => {
  describe("write and read", () => {
    it("should write and read a file", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "test.txt");
      const content = "Hello, World!";

      await NodeFileSystemBridge.write(filePath, content);
      const result = await NodeFileSystemBridge.read(filePath);

      expect(result).toBe(content);
    });

    it("should write with different encoding", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "test-encoding.txt");
      const content = "Test content with encoding";

      await NodeFileSystemBridge.write(filePath, content, "utf-8");
      const result = await NodeFileSystemBridge.read(filePath);

      expect(result).toBe(content);
    });

    it("should overwrite existing file", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "overwrite.txt");

      await NodeFileSystemBridge.write(filePath, "original");
      await NodeFileSystemBridge.write(filePath, "updated");
      const result = await NodeFileSystemBridge.read(filePath);

      expect(result).toBe("updated");
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "exists.txt");
      await NodeFileSystemBridge.write(filePath, "content");

      const exists = await NodeFileSystemBridge.exists(filePath);

      expect(exists).toBe(true);
    });

    it("should return false for non-existing file", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "does-not-exist.txt");

      const exists = await NodeFileSystemBridge.exists(filePath);

      expect(exists).toBe(false);
    });

    it("should return true for existing directory", async () => {
      const testDir = await testdir({});
      const exists = await NodeFileSystemBridge.exists(testDir);

      expect(exists).toBe(true);
    });
  });

  describe("mkdir", () => {
    it("should create a directory", async () => {
      const testDir = await testdir({});
      const dirPath = join(testDir, "new-dir");

      await NodeFileSystemBridge.mkdir(dirPath);
      const exists = await NodeFileSystemBridge.exists(dirPath);

      expect(exists).toBe(true);
    });

    it("should create nested directories", async () => {
      const testDir = await testdir({});
      const dirPath = join(testDir, "nested", "deep", "directory");

      await NodeFileSystemBridge.mkdir(dirPath);
      const exists = await NodeFileSystemBridge.exists(dirPath);

      expect(exists).toBe(true);
    });

    it("should not throw if directory already exists", async () => {
      const testDir = await testdir({});
      const dirPath = join(testDir, "existing-dir");

      await NodeFileSystemBridge.mkdir(dirPath);

      // Should not throw
      await expect(NodeFileSystemBridge.mkdir(dirPath)).resolves.toBeUndefined();
    });
  });

  describe("listdir", () => {
    it("should list directory contents non-recursively", async () => {
      const testDir = await testdir({
        "subdir": {
          "nested.txt": "nested content",
        },
        "file1.txt": "content1",
        "file2.txt": "content2",
      });

      const contents = await NodeFileSystemBridge.listdir(testDir, false);

      expect(contents).toHaveLength(3);
      expect(contents).toContain("subdir");
      expect(contents).toContain("file1.txt");
      expect(contents).toContain("file2.txt");
    });

    it("should list directory contents recursively", async () => {
      const testDir = await testdir({
        "subdir": {
          "nested.txt": "nested content",
        },
        "file1.txt": "content1",
        "file2.txt": "content2",
      });

      const contents = await NodeFileSystemBridge.listdir(testDir, true);

      expect(contents.length).toBeGreaterThan(3);
      expect(contents).toContain("subdir");
      expect(contents).toContain("file1.txt");
      expect(contents).toContain("file2.txt");
      expect(contents.some((item: string) => item.includes("nested.txt"))).toBe(true);
    });

    it("should default to non-recursive when recursive is undefined", async () => {
      const testDir = await testdir({
        "subdir": {
          "nested.txt": "nested content",
        },
        "file1.txt": "content1",
        "file2.txt": "content2",
      });

      const contents = await NodeFileSystemBridge.listdir(testDir);

      expect(contents).toHaveLength(3);
      expect(contents).toContain("subdir");
      expect(contents).toContain("file1.txt");
      expect(contents).toContain("file2.txt");
    });
  });

  describe("rm", () => {
    it("should remove a file", async () => {
      const testDir = await testdir({
        "to-remove.txt": "content",
      });
      const filePath = join(testDir, "to-remove.txt");

      await NodeFileSystemBridge.rm(filePath);
      const exists = await NodeFileSystemBridge.exists(filePath);

      expect(exists).toBe(false);
    });

    it("should fail to remove a directory with recursive=false (default)", async () => {
      const testDir = await testdir({
        "dir-to-remove/file.txt": "content",
      });
      const dirPath = join(testDir, "dir-to-remove");

      // Should throw because recursive defaults to false
      await expect(NodeFileSystemBridge.rm(dirPath)).rejects.toThrow();
    });

    it("should remove a directory when recursive=true", async () => {
      const testDir = await testdir({
        "dir-to-remove": {
          "file.txt": "content",
        },
      });
      const dirPath = join(testDir, "dir-to-remove");

      await NodeFileSystemBridge.rm(dirPath, { recursive: true });
      const exists = await NodeFileSystemBridge.exists(dirPath);

      expect(exists).toBe(false);
    });

    it("should remove with custom options", async () => {
      const testDir = await testdir({
        "remove-with-options.txt": "content",
      });
      const filePath = join(testDir, "remove-with-options.txt");

      await NodeFileSystemBridge.rm(filePath, { recursive: false, force: true });
      const exists = await NodeFileSystemBridge.exists(filePath);

      expect(exists).toBe(false);
    });

    it("should throw when removing non-existing file with force=false (default)", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "non-existing.txt");

      // Should throw due to force: false default
      await expect(NodeFileSystemBridge.rm(filePath)).rejects.toThrow();
    });

    it("should not throw when removing non-existing file with force=true", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "non-existing.txt");

      // Should not throw when force is explicitly set to true
      await expect(NodeFileSystemBridge.rm(filePath, { force: true })).resolves.toBeUndefined();
    });
  });

  describe("stat", () => {
    it("should return stats for a file", async () => {
      const testDir = await testdir({
        "stat-test.txt": "content",
      });
      const filePath = join(testDir, "stat-test.txt");

      const stats = await NodeFileSystemBridge.stat(filePath);

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should return stats for a directory", async () => {
      const testDir = await testdir({});
      const stats = await NodeFileSystemBridge.stat(testDir);

      expect(stats.isFile()).toBe(false);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should throw for non-existing path", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "non-existing.txt");

      await expect(NodeFileSystemBridge.stat(filePath)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw when reading non-existing file", async () => {
      const testDir = await testdir({});
      const filePath = join(testDir, "non-existing.txt");

      await expect(NodeFileSystemBridge.read(filePath)).rejects.toThrow();
    });

    it("should throw when listing non-existing directory", async () => {
      const testDir = await testdir({});
      const dirPath = join(testDir, "non-existing-dir");

      await expect(NodeFileSystemBridge.listdir(dirPath)).rejects.toThrow();
    });

    it("should throw when writing to invalid path", async () => {
      const filePath = join("/invalid/path/that/does/not/exist", "file.txt");

      await expect(NodeFileSystemBridge.write(filePath, "content")).rejects.toThrow();
    });
  });
});
