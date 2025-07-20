import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBridge from "../../src/fs-bridge/node";

describe("fs-bridge#node", () => {
  describe("capabilities", () => {
    it("should have all capabilities enabled", () => {
      expect(NodeFileSystemBridge.capabilities).toEqual({
        read: true,
        write: true,
        listdir: true,
        mkdir: true,
        stat: true,
        exists: true,
        rm: true,
      });
    });
  });

  describe("read", () => {
    it("should read file content with UTF-8 encoding", async () => {
      const testdirPath = await testdir({
        "test-file.txt": "Hello, World!",
      });

      const content = await NodeFileSystemBridge.read(`${testdirPath}/test-file.txt`);
      expect(content).toBe("Hello, World!");
    });

    it("should read unicode content correctly", async () => {
      const testdirPath = await testdir({
        "unicode-file.txt": "Unicode content: 🚀 ñ é ü",
      });

      const content = await NodeFileSystemBridge.read(`${testdirPath}/unicode-file.txt`);
      expect(content).toBe("Unicode content: 🚀 ñ é ü");
    });

    it("should read nested file content", async () => {
      const testdirPath = await testdir({
        "test-dir": {
          "nested-file.txt": "Nested content",
        },
      });

      const content = await NodeFileSystemBridge.read(`${testdirPath}/test-dir/nested-file.txt`);
      expect(content).toBe("Nested content");
    });

    it("should throw error for non-existent file", async () => {
      const testdirPath = await testdir({});

      await expect(
        NodeFileSystemBridge.read(`${testdirPath}/non-existent.txt`),
      ).rejects.toThrow();
    });
  });

  describe("write", () => {
    it("should write file content with default UTF-8 encoding", async () => {
      const testdirPath = await testdir({});
      const filePath = `${testdirPath}/new-file.txt`;
      const content = "New file content";

      await NodeFileSystemBridge.write(filePath, content);
      const readContent = await NodeFileSystemBridge.read(filePath);

      expect(readContent).toBe(content);
    });

    it("should write file content with specified encoding", async () => {
      const testdirPath = await testdir({});
      const filePath = `${testdirPath}/encoded-file.txt`;
      const content = "Encoded content";

      await NodeFileSystemBridge.write(filePath, content, "utf8");
      const readContent = await NodeFileSystemBridge.read(filePath);

      expect(readContent).toBe(content);
    });

    it("should write unicode content correctly", async () => {
      const testdirPath = await testdir({});
      const filePath = `${testdirPath}/unicode-write.txt`;
      const content = "Unicode: 🌟 ñáéíóú";

      await NodeFileSystemBridge.write(filePath, content);
      const readContent = await NodeFileSystemBridge.read(filePath);

      expect(readContent).toBe(content);
    });

    it("should overwrite existing file", async () => {
      const testdirPath = await testdir({
        "test-file.txt": "Original content",
      });
      const filePath = `${testdirPath}/test-file.txt`;
      const newContent = "Overwritten content";

      await NodeFileSystemBridge.write(filePath, newContent);
      const readContent = await NodeFileSystemBridge.read(filePath);

      expect(readContent).toBe(newContent);
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      const testdirPath = await testdir({
        "test-file.txt": "Hello, World!",
      });

      const exists = await NodeFileSystemBridge.exists(`${testdirPath}/test-file.txt`);
      expect(exists).toBe(true);
    });

    it("should return true for existing directory", async () => {
      const testdirPath = await testdir({
        "test-dir": {},
      });

      const exists = await NodeFileSystemBridge.exists(`${testdirPath}/test-dir`);
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const testdirPath = await testdir({});

      const exists = await NodeFileSystemBridge.exists(`${testdirPath}/non-existent.txt`);
      expect(exists).toBe(false);
    });

    it("should return false for non-existent directory", async () => {
      const testdirPath = await testdir({});

      const exists = await NodeFileSystemBridge.exists(`${testdirPath}/non-existent-dir`);
      expect(exists).toBe(false);
    });
  });

  describe("listdir", () => {
    it("should list directory contents without recursion", async () => {
      const testdirPath = await testdir({
        "test-file.txt": "content",
        "test-dir": {},
        "unicode-file.txt": "unicode",
        "empty-dir": {},
      });

      const entries = await NodeFileSystemBridge.listdir(testdirPath);

      expect(entries).toHaveLength(4);
      expect(entries.map((e) => e.name)).toContain("test-file.txt");
      expect(entries.map((e) => e.name)).toContain("test-dir");
      expect(entries.map((e) => e.name)).toContain("unicode-file.txt");
      expect(entries.map((e) => e.name)).toContain("empty-dir");

      const fileEntry = entries.find((e) => e.name === "test-file.txt");
      expect(fileEntry?.type).toBe("file");
      expect(fileEntry?.path).toBe("test-file.txt");

      const dirEntry = entries.find((e) => e.name === "test-dir");
      expect(dirEntry?.type).toBe("directory");
      expect(dirEntry?.path).toBe("test-dir");
    });

    it("should list directory contents with recursion", async () => {
      const testdirPath = await testdir({
        "test-file.txt": "content",
        "test-dir": {
          "nested-file.txt": "nested",
          "subdir": {
            "deep-file.txt": "deep",
          },
        },
      });

      const entries = await NodeFileSystemBridge.listdir(testdirPath, true);

      expect(entries.length).toBeGreaterThan(4);
      expect(entries.map((e) => e.name)).toContain("nested-file.txt");
      expect(entries.map((e) => e.name)).toContain("deep-file.txt");

      const nestedFile = entries.find((e) => e.name === "nested-file.txt");
      expect(nestedFile?.path).toBe(`${testdirPath}/test-dir/nested-file.txt`);

      const deepFile = entries.find((e) => e.name === "deep-file.txt");
      expect(deepFile?.path).toBe(`${testdirPath}/test-dir/subdir/deep-file.txt`);
    });

    it("should handle empty directory", async () => {
      const testdirPath = await testdir({
        "empty-dir": {},
      });

      const entries = await NodeFileSystemBridge.listdir(`${testdirPath}/empty-dir`);
      expect(entries).toHaveLength(0);
    });

    it("should throw error for non-existent directory", async () => {
      const testdirPath = await testdir({});

      await expect(
        NodeFileSystemBridge.listdir(`${testdirPath}/non-existent-dir`),
      ).rejects.toThrow();
    });
  });

  describe("mkdir", () => {
    it("should create a new directory", async () => {
      const testdirPath = await testdir({});
      const newDirPath = `${testdirPath}/new-directory`;

      await NodeFileSystemBridge.mkdir(newDirPath);
      const exists = await NodeFileSystemBridge.exists(newDirPath);

      expect(exists).toBe(true);
    });

    it("should create nested directories recursively", async () => {
      const testdirPath = await testdir({});
      const nestedDirPath = `${testdirPath}/level1/level2/level3`;

      await NodeFileSystemBridge.mkdir(nestedDirPath);
      const exists = await NodeFileSystemBridge.exists(nestedDirPath);

      expect(exists).toBe(true);
    });

    it("should not throw error if directory already exists", async () => {
      const testdirPath = await testdir({
        "test-dir": {},
      });
      const existingDirPath = `${testdirPath}/test-dir`;

      await expect(NodeFileSystemBridge.mkdir(existingDirPath)).resolves.toBeUndefined();
    });

    it("should return undefined", async () => {
      const testdirPath = await testdir({});
      const newDirPath = `${testdirPath}/return-test-dir`;
      const result = await NodeFileSystemBridge.mkdir(newDirPath);

      expect(result).toBeUndefined();
    });
  });

  describe("stat", () => {
    it("should return stats for a file", async () => {
      const testdirPath = await testdir({
        "test-file.txt": "Hello, World!",
      });

      const stats = await NodeFileSystemBridge.stat(`${testdirPath}/test-file.txt`);

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.mtime).toBeInstanceOf(Date);
    });

    it("should return stats for a directory", async () => {
      const testdirPath = await testdir({
        "test-dir": {},
      });

      const stats = await NodeFileSystemBridge.stat(`${testdirPath}/test-dir`);

      expect(stats.isFile()).toBe(false);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.mtime).toBeInstanceOf(Date);
    });

    it("should throw error for non-existent path", async () => {
      const testdirPath = await testdir({});

      await expect(
        NodeFileSystemBridge.stat(`${testdirPath}/non-existent`),
      ).rejects.toThrow();
    });
  });

  describe("rm", () => {
    it("should remove a file without options", async () => {
      const testdirPath = await testdir({});
      const filePath = `${testdirPath}/to-be-removed.txt`;
      await NodeFileSystemBridge.write(filePath, "content");

      await NodeFileSystemBridge.rm(filePath);
      const exists = await NodeFileSystemBridge.exists(filePath);

      expect(exists).toBe(false);
    });

    it("should remove an empty directory", async () => {
      const testdirPath = await testdir({});
      const dirPath = `${testdirPath}/empty-to-remove`;
      await NodeFileSystemBridge.mkdir(dirPath);

      await NodeFileSystemBridge.rm(dirPath);
      const exists = await NodeFileSystemBridge.exists(dirPath);

      expect(exists).toBe(false);
    });

    it("should remove directory with recursive option", async () => {
      const testdirPath = await testdir({});
      const dirPath = `${testdirPath}/recursive-remove`;
      await NodeFileSystemBridge.mkdir(`${dirPath}/subdir`);
      await NodeFileSystemBridge.write(`${dirPath}/file.txt`, "content");
      await NodeFileSystemBridge.write(`${dirPath}/subdir/nested.txt`, "nested");

      await NodeFileSystemBridge.rm(dirPath, { recursive: true });
      const exists = await NodeFileSystemBridge.exists(dirPath);

      expect(exists).toBe(false);
    });

    it("should handle force option for non-existent files", async () => {
      const testdirPath = await testdir({});
      const nonExistentPath = `${testdirPath}/non-existent.txt`;

      await expect(
        NodeFileSystemBridge.rm(nonExistentPath, { force: true }),
      ).resolves.toBeUndefined();
    });

    it("should remove with both recursive and force options", async () => {
      const testdirPath = await testdir({});
      const dirPath = `${testdirPath}/force-recursive-remove`;
      await NodeFileSystemBridge.mkdir(dirPath);

      await NodeFileSystemBridge.rm(dirPath, { recursive: true, force: true });
      const exists = await NodeFileSystemBridge.exists(dirPath);

      expect(exists).toBe(false);
    });

    it("should throw error when removing non-empty directory without recursive", async () => {
      const testdirPath = await testdir({});
      const dirPath = `${testdirPath}/non-empty-dir`;
      await NodeFileSystemBridge.mkdir(dirPath);
      await NodeFileSystemBridge.write(`${dirPath}/file.txt`, "content");

      await expect(NodeFileSystemBridge.rm(dirPath)).rejects.toThrow();
    });

    it("should throw error for non-existent file without force option", async () => {
      const testdirPath = await testdir({});
      const nonExistentPath = `${testdirPath}/truly-non-existent.txt`;

      await expect(NodeFileSystemBridge.rm(nonExistentPath)).rejects.toThrow();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete file lifecycle", async () => {
      const testdirPath = await testdir({});
      const filePath = `${testdirPath}/lifecycle-test.txt`;
      const content = "Lifecycle test content";

      await NodeFileSystemBridge.write(filePath, content);
      expect(await NodeFileSystemBridge.exists(filePath)).toBe(true);

      const readContent = await NodeFileSystemBridge.read(filePath);
      expect(readContent).toBe(content);

      const stats = await NodeFileSystemBridge.stat(filePath);
      expect(stats.isFile()).toBe(true);

      await NodeFileSystemBridge.rm(filePath);
      expect(await NodeFileSystemBridge.exists(filePath)).toBe(false);
    });

    it("should handle complete directory lifecycle", async () => {
      const testdirPath = await testdir({});
      const dirPath = `${testdirPath}/dir-lifecycle`;
      const filePath = `${dirPath}/test-file.txt`;

      await NodeFileSystemBridge.mkdir(dirPath);
      expect(await NodeFileSystemBridge.exists(dirPath)).toBe(true);

      await NodeFileSystemBridge.write(filePath, "test content");

      const entries = await NodeFileSystemBridge.listdir(dirPath);
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe("test-file.txt");

      await NodeFileSystemBridge.rm(dirPath, { recursive: true });
      expect(await NodeFileSystemBridge.exists(dirPath)).toBe(false);
    });

    it("should handle complex nested operations", async () => {
      const testdirPath = await testdir({}, {
        cleanup: false,
      });

      await NodeFileSystemBridge.mkdir(`${testdirPath}/level1/level2`);

      const files = [
        { path: `${testdirPath}/root-file.txt`, content: "root" },
        { path: `${testdirPath}/level1/level1-file.txt`, content: "level1" },
        { path: `${testdirPath}/level1/level2/level2-file.txt`, content: "level2" },
      ];

      for (const file of files) {
        await NodeFileSystemBridge.write(file.path, file.content);
      }

      const recursiveEntries = await NodeFileSystemBridge.listdir(testdirPath, true);
      expect(recursiveEntries.length).toBeGreaterThanOrEqual(2);

      // flatten
      const flattenedEntries = flattenFilePaths(recursiveEntries, testdirPath);

      await NodeFileSystemBridge.rm(baseDir, { recursive: true });
      expect(await NodeFileSystemBridge.exists(baseDir)).toBe(false);
    });
  });
});
