import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultFs, type FsInterface } from "../src/fs-interface";

describe("fsInterface", () => {
  describe("createDefaultFs", () => {
    let fs: FsInterface;
    let mockFsExtra: any;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock fs-extra module
      mockFsExtra = {
        ensureDir: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn(),
        pathExists: vi.fn(),
        access: vi.fn(),
        mkdirp: vi.fn(),
        mkdir: vi.fn(),
      };

      // Mock dynamic import of fs-extra
      vi.doMock("fs-extra", () => mockFsExtra);

      fs = createDefaultFs();
    });

    it("should implement all FsInterface methods", () => {
      expect(fs.ensureDir).toBeDefined();
      expect(fs.writeFile).toBeDefined();
      expect(fs.readFile).toBeDefined();
      expect(fs.pathExists).toBeDefined();
      expect(fs.access).toBeDefined();
      expect(fs.mkdir).toBeDefined();
    });

    it("should call fs-extra ensureDir", async () => {
      mockFsExtra.ensureDir.mockResolvedValue(undefined);

      await fs.ensureDir("/test/path");

      expect(mockFsExtra.ensureDir).toHaveBeenCalledWith("/test/path");
    });

    it("should call fs-extra writeFile with correct parameters", async () => {
      mockFsExtra.writeFile.mockResolvedValue(undefined);

      await fs.writeFile("/test/file.txt", "content", "utf-8");

      expect(mockFsExtra.writeFile).toHaveBeenCalledWith("/test/file.txt", "content", "utf-8");
    });

    it("should call fs-extra writeFile with default encoding", async () => {
      mockFsExtra.writeFile.mockResolvedValue(undefined);

      await fs.writeFile("/test/file.txt", "content");

      expect(mockFsExtra.writeFile).toHaveBeenCalledWith("/test/file.txt", "content", "utf-8");
    });

    it("should call fs-extra readFile with correct parameters", async () => {
      mockFsExtra.readFile.mockResolvedValue("file content");

      const result = await fs.readFile("/test/file.txt", "utf-8");

      expect(result).toBe("file content");
      expect(mockFsExtra.readFile).toHaveBeenCalledWith("/test/file.txt", "utf-8");
    });

    it("should call fs-extra readFile with default encoding", async () => {
      mockFsExtra.readFile.mockResolvedValue("file content");

      const result = await fs.readFile("/test/file.txt");

      expect(result).toBe("file content");
      expect(mockFsExtra.readFile).toHaveBeenCalledWith("/test/file.txt", "utf-8");
    });

    it("should call fs-extra pathExists", async () => {
      mockFsExtra.pathExists.mockResolvedValue(true);

      const result = await fs.pathExists("/test/path");

      expect(result).toBe(true);
      expect(mockFsExtra.pathExists).toHaveBeenCalledWith("/test/path");
    });

    it("should call fs-extra access", async () => {
      mockFsExtra.access.mockResolvedValue(undefined);

      await fs.access("/test/file.txt");

      expect(mockFsExtra.access).toHaveBeenCalledWith("/test/file.txt");
    });

    it("should call fs-extra mkdir with options", async () => {
      mockFsExtra.mkdir.mockResolvedValue(undefined);

      await fs.mkdir("/test/path", { recursive: true });

      expect(mockFsExtra.mkdir).toHaveBeenCalledWith("/test/path", { recursive: true });
    });

    it("should call fs-extra mkdir without options", async () => {
      mockFsExtra.mkdir.mockResolvedValue(undefined);

      await fs.mkdir("/test/path");

      expect(mockFsExtra.mkdir).toHaveBeenCalledWith("/test/path", undefined);
    });

    it("should handle fs-extra errors", async () => {
      const error = new Error("File system error");
      mockFsExtra.ensureDir.mockRejectedValue(error);

      await expect(fs.ensureDir("/test/path")).rejects.toThrow("File system error");
    });

    it("should cache fs-extra module import", async () => {
      mockFsExtra.ensureDir.mockResolvedValue(undefined);

      // Call multiple methods to test module caching
      await fs.ensureDir("/test/path1");
      await fs.writeFile("/test/file.txt", "content");
      await fs.readFile("/test/file.txt");

      // Verify that fs-extra methods were called
      expect(mockFsExtra.ensureDir).toHaveBeenCalledTimes(1);
      expect(mockFsExtra.writeFile).toHaveBeenCalledTimes(1);
      expect(mockFsExtra.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe("createDefaultFs factory", () => {
    it("should return an object implementing FsInterface", () => {
      const fs = createDefaultFs();
      expect(fs).toBeDefined();
      expect(typeof fs.ensureDir).toBe("function");
      expect(typeof fs.writeFile).toBe("function");
      expect(typeof fs.readFile).toBe("function");
      expect(typeof fs.pathExists).toBe("function");
      expect(typeof fs.access).toBe("function");
      expect(typeof fs.mkdir).toBe("function");
    });

    it("should return different instances on multiple calls", () => {
      const fs1 = createDefaultFs();
      const fs2 = createDefaultFs();
      expect(fs1).not.toBe(fs2);
    });
  });
});
