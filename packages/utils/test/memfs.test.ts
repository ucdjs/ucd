import type { FSAdapter } from "../src/types";
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createFileSystem } from "../src/memfs";

describe("memfs utility", () => {
  describe("createFileSystem", () => {
    it("should create a memfs file system by default", () => {
      const fs = createFileSystem();
      expect(fs).toBeDefined();
      expect(fs.read).toBeInstanceOf(Function);
      expect(fs.write).toBeInstanceOf(Function);
    });

    it("should initialize with provided files", async () => {
      const initialFiles = {
        "/test.txt": "content",
      };

      const fs = createFileSystem({ initialFiles });
      const content = await fs.read("/test.txt");

      expect(content).toBe("content");
    });

    it("should use a custom file system when specified", () => {
      const customFs: FSAdapter = {
        read: vi.fn().mockResolvedValue("custom"),
        write: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        listdir: vi.fn().mockResolvedValue([]),
        stat: vi.fn().mockResolvedValue({
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          size: 0,
        }),
        rm: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        ensureDir: vi.fn().mockResolvedValue(undefined),
      };

      const fs = createFileSystem({ type: "custom", fs: customFs });
      expect(fs).toBe(customFs);
    });

    it("should throw an error when type is custom but no fs is provided", () => {
      expect(() => createFileSystem({
        type: "custom",
        // @ts-expect-error Testing missing fs
        fs: undefined,
      }))
        .toThrow("fs must be provided when type is \"custom\"");
    });

    it("should throw an error for unsupported file system types", () => {
      // @ts-expect-error Testing invalid type
      expect(() => createFileSystem({ type: "invalid" }))
        .toThrow("Unsupported file system type: invalid. Use \"memfs\" or \"custom\"");
    });
  });

  describe("file operations", () => {
    let fs: FSAdapter;

    beforeEach(() => {
      fs = createFileSystem();
    });

    it("should write and read a file", async () => {
      await fs.write("/file.txt", "Hello World");
      const content = await fs.read("/file.txt");

      expect(content).toBe("Hello World");
    });

    it("should create and read directories", async () => {
      await fs.mkdir("/test-dir", { recursive: true });
      await fs.write("/test-dir/file.txt", "Content");

      const files = await fs.listdir("/test-dir");
      expect(files).toContain("file.txt");
    });

    it("should check if a file exists", async () => {
      await fs.write("/exists.txt", "exists");

      expect(await fs.exists("/exists.txt")).toBe(true);
      expect(await fs.exists("/not-exists.txt")).toBe(false);
    });

    it("should delete files", async () => {
      await fs.write("/to-delete.txt", "delete me");
      await fs.rm("/to-delete.txt");

      expect(await fs.exists("/to-delete.txt")).toBe(false);
    });

    it("should get file stats", async () => {
      await fs.write("/stat.txt", "stat content");
      const stats = await fs.stat("/stat.txt");

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should remove directories", async () => {
      await fs.mkdir("/dir-to-remove", { recursive: true });
      await fs.write("/dir-to-remove/file.txt", "content");

      await fs.rm("/dir-to-remove", { recursive: true });
      expect(await fs.exists("/dir-to-remove")).toBe(false);
    });

    it("should ensure directory exists", async () => {
      await fs.ensureDir("/ensure-dir", { recursive: true });
      expect(await fs.exists("/ensure-dir")).toBe(true);

      // Should not throw if directory already exists
      await fs.ensureDir("/ensure-dir", { recursive: true });
      expect(await fs.exists("/ensure-dir")).toBe(true);
    });
  });

  describe("custom fs with mocks", () => {
    it("should use mocked fs functions", async () => {
      const mockRead = vi.fn().mockResolvedValue("mocked content");
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      const mockMkdir = vi.fn().mockResolvedValue(undefined);
      const mockListdir = vi.fn().mockResolvedValue(["file1.txt", "file2.txt"]);
      const mockStat = vi.fn().mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date("2023-01-01"),
        size: 100,
      });
      const mockRm = vi.fn().mockResolvedValue(undefined);
      const mockExists = vi.fn().mockResolvedValue(true);
      const mockEnsureDir = vi.fn().mockResolvedValue(undefined);

      const customFs = {
        read: mockRead,
        write: mockWrite,
        mkdir: mockMkdir,
        listdir: mockListdir,
        stat: mockStat,
        rm: mockRm,
        exists: mockExists,
        ensureDir: mockEnsureDir,
      } satisfies FSAdapter;

      const fs = createFileSystem({ type: "custom", fs: customFs });

      // Test read
      const content = await fs.read("/test.txt");
      expect(content).toBe("mocked content");
      expect(mockRead).toHaveBeenCalledWith("/test.txt");

      // Test write
      await fs.write("/test.txt", "new content");
      expect(mockWrite).toHaveBeenCalledWith("/test.txt", "new content");

      // Test mkdir
      await fs.mkdir("/new-dir", { recursive: true });
      expect(mockMkdir).toHaveBeenCalledWith("/new-dir", { recursive: true });

      // Test listdir
      const files = await fs.listdir("/dir");
      expect(files).toEqual(["file1.txt", "file2.txt"]);
      expect(mockListdir).toHaveBeenCalledWith("/dir");

      // Test stat
      const stat = await fs.stat("/test.txt");
      expect(stat.isFile()).toBe(true);
      expect(stat.size).toBe(100);
      expect(mockStat).toHaveBeenCalledWith("/test.txt");

      // Test exists
      const exists = await fs.exists("/test.txt");
      expect(exists).toBe(true);
      expect(mockExists).toHaveBeenCalledWith("/test.txt");

      // Test rm
      await fs.rm("/dir", { recursive: true });
      expect(mockRm).toHaveBeenCalledWith("/dir", { recursive: true });

      // Test ensureDir
      await fs.ensureDir("/ensure-dir");
      expect(mockEnsureDir).toHaveBeenCalledWith("/ensure-dir");
    });

    it("should handle mocked errors", async () => {
      const mockRead = vi.fn().mockRejectedValue(new Error("File not found"));

      const customFs: FSAdapter = {
        read: mockRead,
        write: vi.fn(),
        mkdir: vi.fn(),
        listdir: vi.fn(),
        stat: vi.fn(),
        rm: vi.fn(),
        exists: vi.fn(),
        ensureDir: vi.fn(),
      };

      const fs = createFileSystem({ type: "custom", fs: customFs });

      await expect(fs.read("/nonexistent.txt")).rejects.toThrow("File not found");
      expect(mockRead).toHaveBeenCalledWith("/nonexistent.txt");
    });
  });

  describe("custom fs with Node.js fs", () => {
    it("should use Node.js fs for file operations", async () => {
      const testPath = await testdir({
        "existing-file.txt": "existing content",
        "subdir/nested-file.txt": "nested content",
      });

      const nodeFs: FSAdapter = {
        read: async (path: string) => {
          return readFile(join(testPath, path), "utf-8");
        },
        write: async (path: string, data: string) => {
          await mkdir(join(testPath, path, ".."), { recursive: true });
          return writeFile(join(testPath, path), data, "utf-8");
        },
        mkdir: async (path: string, options?: { recursive?: boolean; mode?: number }) => {
          await mkdir(join(testPath, path), options);
        },
        listdir: async (path: string) => {
          return readdir(join(testPath, path));
        },
        stat: async (path: string) => {
          const stats = await stat(join(testPath, path));
          return {
            isFile: () => stats.isFile(),
            isDirectory: () => stats.isDirectory(),
            mtime: stats.mtime,
            size: stats.size,
          };
        },
        exists: async (path: string) => {
          try {
            await access(join(testPath, path));
            return true;
          } catch {
            return false;
          }
        },
        rm: async (path: string, options?: { recursive?: boolean; force?: boolean }) => {
          return rm(join(testPath, path), options);
        },
        ensureDir: async (path: string, options?: { recursive?: boolean; mode?: number }) => {
          try {
            await mkdir(join(testPath, path), { recursive: true, ...options });
          } catch (err: any) {
            if (err.code !== "EEXIST") {
              throw err;
            }
          }
        },
      };

      const fs = createFileSystem({ type: "custom", fs: nodeFs });

      // Test reading existing files
      const existingContent = await fs.read("/existing-file.txt");
      expect(existingContent).toBe("existing content");

      const nestedContent = await fs.read("/subdir/nested-file.txt");
      expect(nestedContent).toBe("nested content");

      // Test write and read
      await fs.write("/node-test.txt", "Node.js content");
      const content = await fs.read("/node-test.txt");
      expect(content).toBe("Node.js content");

      // Test mkdir and listdir
      await fs.mkdir("/node-dir", { recursive: true });
      await fs.write("/node-dir/file.txt", "directory content");
      const files = await fs.listdir("/node-dir");
      expect(files).toContain("file.txt");

      // Test stat
      const stats = await fs.stat("/node-test.txt");
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);

      // Test exists
      expect(await fs.exists("/node-test.txt")).toBe(true);
      expect(await fs.exists("/non-existent.txt")).toBe(false);

      // Test rm directory
      await fs.rm("/node-dir", { recursive: true });
      expect(await fs.exists("/node-dir")).toBe(false);

      // Test ensureDir
      await fs.ensureDir("/ensure-test");
      expect(await fs.exists("/ensure-test")).toBe(true);
    });

    it("should handle Node.js fs errors appropriately", async () => {
      const testPath = await testdir({});

      const nodeFs: FSAdapter = {
        read: async (path: string) => {
          return readFile(join(testPath, path), "utf-8");
        },
        write: vi.fn(),
        mkdir: vi.fn(),
        listdir: vi.fn(),
        stat: vi.fn(),
        exists: vi.fn(),
        rm: vi.fn(),
        ensureDir: vi.fn(),
      };

      const fs = createFileSystem({ type: "custom", fs: nodeFs });

      // Should throw error for non-existent file
      await expect(fs.read("/does-not-exist.txt")).rejects.toThrow();
    });

    it("should work with complex directory structures", async () => {
      const testPath = await testdir({
        "root-file.txt": "root content",
        "dir1/file1.txt": "file1 content",
        "dir1/file2.txt": "file2 content",
        "dir1/subdir/deep-file.txt": "deep content",
        "dir2/another-file.txt": "another content",
      });

      const nodeFs: FSAdapter = {
        read: async (path: string) => {
          return readFile(join(testPath, path), "utf-8");
        },
        write: vi.fn(),
        mkdir: vi.fn(),
        listdir: async (path: string) => {
          return readdir(join(testPath, path));
        },
        stat: vi.fn(),
        exists: vi.fn(),
        rm: vi.fn(),
        ensureDir: vi.fn(),
      };

      const fs = createFileSystem({ type: "custom", fs: nodeFs });

      // Test reading files from different directories
      expect(await fs.read("/root-file.txt")).toBe("root content");
      expect(await fs.read("/dir1/file1.txt")).toBe("file1 content");
      expect(await fs.read("/dir1/subdir/deep-file.txt")).toBe("deep content");
      expect(await fs.read("/dir2/another-file.txt")).toBe("another content");

      // Test reading directories
      const dir1Files = await fs.listdir("/dir1");
      expect(dir1Files).toContain("file1.txt");
      expect(dir1Files).toContain("file2.txt");
      expect(dir1Files).toContain("subdir");

      const rootFiles = await fs.listdir("/");
      expect(rootFiles).toContain("root-file.txt");
      expect(rootFiles).toContain("dir1");
      expect(rootFiles).toContain("dir2");
    });
  });
});
