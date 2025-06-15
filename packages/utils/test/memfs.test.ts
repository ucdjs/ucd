import { access, copyFile, mkdir, readdir, readFile, rm, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createFileSystem, type FSAdapter } from "../src/memfs";

describe("memfs utility", () => {
  describe("createFileSystem", () => {
    it("should create a memfs file system by default", () => {
      const fs = createFileSystem();
      expect(fs).toBeDefined();
      expect(fs.readFile).toBeInstanceOf(Function);
      expect(fs.writeFile).toBeInstanceOf(Function);
    });

    it("should initialize with provided files", async () => {
      const initialFiles = {
        "/test.txt": "content",
      };

      const fs = createFileSystem({ initialFiles });
      const content = await fs.readFile("/test.txt");

      expect(content).toBe("content");
    });

    it("should use a custom file system when specified", () => {
      const customFs: FSAdapter = {
        readFile: async () => "custom",
        writeFile: async () => {},
        mkdir: async () => {},
        readdir: async () => [],
        stat: async () => ({
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          size: 0,
        }),
        unlink: async () => {},
        access: async () => {},
        rmdir: async () => {},
        rm: async () => {},
        copyFile: async () => {},
      };

      const fs = createFileSystem({ type: "custom", fs: customFs });
      expect(fs).toBe(customFs);
    });

    it("should throw an error when type is custom but no fs is provided", () => {
      expect(() => createFileSystem({
        type: "custom",
        fs: undefined as unknown as FSAdapter,
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
      await fs.writeFile("/file.txt", "Hello World");
      const content = await fs.readFile("/file.txt");

      expect(content).toBe("Hello World");
    });

    it("should create and read directories", async () => {
      await fs.mkdir("/test-dir", { recursive: true });
      await fs.writeFile("/test-dir/file.txt", "Content");

      const files = await fs.readdir("/test-dir");
      expect(files).toContain("file.txt");
    });

    it("should check if a file exists", async () => {
      await fs.writeFile("/exists.txt", "exists");

      await expect(fs.access("/exists.txt")).resolves.toBe(undefined);
      await expect(fs.access("/not-exists.txt")).rejects.toThrow();
    });

    it("should delete files", async () => {
      await fs.writeFile("/to-delete.txt", "delete me");
      await fs.unlink("/to-delete.txt");

      await expect(fs.access("/to-delete.txt")).rejects.toThrow();
    });

    it("should get file stats", async () => {
      await fs.writeFile("/stat.txt", "stat content");
      const stat = await fs.stat("/stat.txt");

      expect(stat.isFile()).toBe(true);
      expect(stat.isDirectory()).toBe(false);
      expect(stat.size).toBeGreaterThan(0);
    });

    it("should copy files", async () => {
      await fs.writeFile("/source.txt", "source content");
      await fs.copyFile("/source.txt", "/dest.txt");

      const content = await fs.readFile("/dest.txt");
      expect(content).toBe("source content");
    });

    it("should remove directories", async () => {
      await fs.mkdir("/dir-to-remove", { recursive: true });
      await fs.writeFile("/dir-to-remove/file.txt", "content");

      await fs.rm("/dir-to-remove", { recursive: true });
      await expect(fs.access("/dir-to-remove")).rejects.toThrow();
    });
  });

  describe("custom fs with mocks", () => {
    it("should use mocked fs functions", async () => {
      const mockReadFile = vi.fn().mockResolvedValue("mocked content");
      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      const mockMkdir = vi.fn().mockResolvedValue(undefined);
      const mockReaddir = vi.fn().mockResolvedValue(["file1.txt", "file2.txt"]);
      const mockStat = vi.fn().mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date("2023-01-01"),
        size: 100,
      });
      const mockUnlink = vi.fn().mockResolvedValue(undefined);
      const mockAccess = vi.fn().mockResolvedValue(undefined);
      const mockRmdir = vi.fn().mockResolvedValue(undefined);
      const mockRm = vi.fn().mockResolvedValue(undefined);
      const mockCopyFile = vi.fn().mockResolvedValue(undefined);

      const customFs: FSAdapter = {
        readFile: mockReadFile,
        writeFile: mockWriteFile,
        mkdir: mockMkdir,
        readdir: mockReaddir,
        stat: mockStat,
        unlink: mockUnlink,
        access: mockAccess,
        rmdir: mockRmdir,
        rm: mockRm,
        copyFile: mockCopyFile,
      };

      const fs = createFileSystem({ type: "custom", fs: customFs });

      // Test readFile
      const content = await fs.readFile("/test.txt");
      expect(content).toBe("mocked content");
      expect(mockReadFile).toHaveBeenCalledWith("/test.txt");

      // Test writeFile
      await fs.writeFile("/test.txt", "new content");
      expect(mockWriteFile).toHaveBeenCalledWith("/test.txt", "new content");

      // Test mkdir
      await fs.mkdir("/new-dir", { recursive: true });
      expect(mockMkdir).toHaveBeenCalledWith("/new-dir", { recursive: true });

      // Test readdir
      const files = await fs.readdir("/dir");
      expect(files).toEqual(["file1.txt", "file2.txt"]);
      expect(mockReaddir).toHaveBeenCalledWith("/dir");

      // Test stat
      const stat = await fs.stat("/test.txt");
      expect(stat.isFile()).toBe(true);
      expect(stat.size).toBe(100);
      expect(mockStat).toHaveBeenCalledWith("/test.txt");

      // Test unlink
      await fs.unlink("/test.txt");
      expect(mockUnlink).toHaveBeenCalledWith("/test.txt");

      // Test access
      await fs.access("/test.txt");
      expect(mockAccess).toHaveBeenCalledWith("/test.txt");

      // Test rmdir
      await fs.rmdir("/dir");
      expect(mockRmdir).toHaveBeenCalledWith("/dir");

      // Test rm
      await fs.rm("/dir", { recursive: true });
      expect(mockRm).toHaveBeenCalledWith("/dir", { recursive: true });

      // Test copyFile
      await fs.copyFile("/src.txt", "/dest.txt");
      expect(mockCopyFile).toHaveBeenCalledWith("/src.txt", "/dest.txt");
    });

    it("should handle mocked errors", async () => {
      const mockReadFile = vi.fn().mockRejectedValue(new Error("File not found"));

      const customFs: FSAdapter = {
        readFile: mockReadFile,
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        readdir: vi.fn(),
        stat: vi.fn(),
        unlink: vi.fn(),
        access: vi.fn(),
        rmdir: vi.fn(),
        rm: vi.fn(),
        copyFile: vi.fn(),
      };

      const fs = createFileSystem({ type: "custom", fs: customFs });

      await expect(fs.readFile("/nonexistent.txt")).rejects.toThrow("File not found");
      expect(mockReadFile).toHaveBeenCalledWith("/nonexistent.txt");
    });
  });

  describe("custom fs with Node.js fs", () => {
    it("should use Node.js fs for file operations", async () => {
      const testPath = await testdir({
        "existing-file.txt": "existing content",
        "subdir/nested-file.txt": "nested content",
      });

      const nodeFs: FSAdapter = {
        readFile: async (path: string) => {
          return readFile(join(testPath, path), "utf-8");
        },
        writeFile: async (path: string, data: string) => {
          await mkdir(join(testPath, path, ".."), { recursive: true });
          return writeFile(join(testPath, path), data, "utf-8");
        },
        mkdir: async (path: string, options?: { recursive?: boolean; mode?: number }) => {
          await mkdir(join(testPath, path), options);
        },
        readdir: async (path: string) => {
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
        unlink: async (path: string) => {
          return unlink(join(testPath, path));
        },
        access: async (path: string, mode?: number) => {
          return access(join(testPath, path), mode);
        },
        rmdir: async (path: string, options?: { recursive?: boolean }) => {
          return rmdir(join(testPath, path), options);
        },
        rm: async (path: string, options?: { recursive?: boolean; force?: boolean }) => {
          return rm(join(testPath, path), options);
        },
        copyFile: async (src: string, dest: string, mode?: number) => {
          return copyFile(join(testPath, src), join(testPath, dest), mode);
        },
      };

      const fs = createFileSystem({ type: "custom", fs: nodeFs });

      // Test reading existing files
      const existingContent = await fs.readFile("/existing-file.txt");
      expect(existingContent).toBe("existing content");

      const nestedContent = await fs.readFile("/subdir/nested-file.txt");
      expect(nestedContent).toBe("nested content");

      // Test write and read
      await fs.writeFile("/node-test.txt", "Node.js content");
      const content = await fs.readFile("/node-test.txt");
      expect(content).toBe("Node.js content");

      // Test mkdir and readdir
      await fs.mkdir("/node-dir", { recursive: true });
      await fs.writeFile("/node-dir/file.txt", "directory content");
      const files = await fs.readdir("/node-dir");
      expect(files).toContain("file.txt");

      // Test stat
      const stats = await fs.stat("/node-test.txt");
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);

      // Test copy
      await fs.copyFile("/node-test.txt", "/node-copy.txt");
      const copiedContent = await fs.readFile("/node-copy.txt");
      expect(copiedContent).toBe("Node.js content");

      // Test unlink
      await fs.unlink("/node-copy.txt");
      await expect(fs.access("/node-copy.txt")).rejects.toThrow();

      // Test rm directory
      await fs.rm("/node-dir", { recursive: true });
      await expect(fs.access("/node-dir")).rejects.toThrow();
    });

    it("should handle Node.js fs errors appropriately", async () => {
      const testPath = await testdir({});

      const nodeFs: FSAdapter = {
        readFile: async (path: string) => {
          return readFile(join(testPath, path), "utf-8");
        },
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        readdir: vi.fn(),
        stat: vi.fn(),
        unlink: vi.fn(),
        access: vi.fn(),
        rmdir: vi.fn(),
        rm: vi.fn(),
        copyFile: vi.fn(),
      };

      const fs = createFileSystem({ type: "custom", fs: nodeFs });

      // Should throw error for non-existent file
      await expect(fs.readFile("/does-not-exist.txt")).rejects.toThrow();
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
        readFile: async (path: string) => {
          return readFile(join(testPath, path), "utf-8");
        },
        writeFile: async (path: string, data: string) => {
          await mkdir(join(testPath, path, ".."), { recursive: true });
          return writeFile(join(testPath, path), data, "utf-8");
        },
        mkdir: vi.fn(),
        readdir: async (path: string) => {
          return readdir(join(testPath, path));
        },
        stat: vi.fn(),
        unlink: vi.fn(),
        access: vi.fn(),
        rmdir: vi.fn(),
        rm: vi.fn(),
        copyFile: vi.fn(),
      };

      const fs = createFileSystem({ type: "custom", fs: nodeFs });

      // Test reading files from different directories
      expect(await fs.readFile("/root-file.txt")).toBe("root content");
      expect(await fs.readFile("/dir1/file1.txt")).toBe("file1 content");
      expect(await fs.readFile("/dir1/subdir/deep-file.txt")).toBe("deep content");
      expect(await fs.readFile("/dir2/another-file.txt")).toBe("another content");

      // Test reading directories
      const dir1Files = await fs.readdir("/dir1");
      expect(dir1Files).toContain("file1.txt");
      expect(dir1Files).toContain("file2.txt");
      expect(dir1Files).toContain("subdir");

      const rootFiles = await fs.readdir("/");
      expect(rootFiles).toContain("root-file.txt");
      expect(rootFiles).toContain("dir1");
      expect(rootFiles).toContain("dir2");
    });
  });
});
