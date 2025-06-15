import { beforeEach, describe, expect, it } from "vitest";
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

    it("should throw an error when type is custom but no fsInstance is provided", () => {
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

      await expect(fs.access("/exists.txt")).resolves.not.toThrow();
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
});
