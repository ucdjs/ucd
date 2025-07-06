import type {
  FileSystemBridge,
  FileSystemBridgeCapabilities,
  FileSystemBridgeRmOptions,
  FSEntry,
  FSStats,
} from "../src/fs-bridge";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defineFileSystemBridge,
  getSupportedBridgeCapabilities,
} from "../src/fs-bridge";

describe("defineFileSystemBridge", () => {
  it("should return the same file system bridge object", () => {
    const mockBridge: FileSystemBridge = {
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };

    const result = defineFileSystemBridge(mockBridge);
    expect(result).toBe(mockBridge);
  });

  it("should work with bridge containing state", () => {
    const mockBridge: FileSystemBridge = {
      state: { lastReadPath: "" },
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };

    const result = defineFileSystemBridge(mockBridge);
    expect(result).toBe(mockBridge);
    expect(result.state).toEqual({ lastReadPath: "" });
  });

  it("should work with bridge containing capabilities", () => {
    const capabilities: FileSystemBridgeCapabilities = {
      read: true,
      write: false,
      listdir: true,
      mkdir: false,
      stat: true,
      exists: true,
      rm: false,
    };

    const mockBridge: FileSystemBridge = {
      capabilities,
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };

    const result = defineFileSystemBridge(mockBridge);
    expect(result.capabilities).toBe(capabilities);
  });
});

describe("getSupportedBridgeCapabilities", () => {
  it("should return bridge capabilities when provided", () => {
    const capabilities: FileSystemBridgeCapabilities = {
      read: true,
      write: false,
      listdir: true,
      mkdir: false,
      stat: true,
      exists: true,
      rm: false,
    };

    const mockBridge: FileSystemBridge = {
      capabilities,
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };

    const result = getSupportedBridgeCapabilities(mockBridge);
    expect(result).toBe(capabilities);
  });

  it("should return default capabilities when bridge has no capabilities", () => {
    const mockBridge: FileSystemBridge = {
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };

    const result = getSupportedBridgeCapabilities(mockBridge);
    expect(result).toEqual({
      exists: true,
      read: true,
      write: true,
      listdir: true,
      mkdir: true,
      stat: true,
      rm: true,
    });
  });

  it("should return default capabilities when bridge capabilities is undefined", () => {
    const mockBridge: FileSystemBridge = {
      capabilities: undefined,
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };

    const result = getSupportedBridgeCapabilities(mockBridge);
    expect(result).toEqual({
      exists: true,
      read: true,
      write: true,
      listdir: true,
      mkdir: true,
      stat: true,
      rm: true,
    });
  });
});

describe("fileSystemBridge interface", () => {
  let mockBridge: FileSystemBridge;

  beforeEach(() => {
    mockBridge = {
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      exists: vi.fn(),
      rm: vi.fn(),
    };
  });

  describe("read method", () => {
    it("should read file content", async () => {
      const mockContent = "file content";
      vi.mocked(mockBridge.read).mockResolvedValue(mockContent);

      const result = await mockBridge.read("/path/to/file.txt");
      expect(result).toBe(mockContent);
      expect(mockBridge.read).toHaveBeenCalledWith("/path/to/file.txt");
    });
  });

  describe("write method", () => {
    it("should write file content with default encoding", async () => {
      await mockBridge.write("/path/to/file.txt", "content");
      expect(mockBridge.write).toHaveBeenCalledWith("/path/to/file.txt", "content");
    });

    it("should write file content with specified encoding", async () => {
      await mockBridge.write("/path/to/file.txt", "content", "utf16le");
      expect(mockBridge.write).toHaveBeenCalledWith("/path/to/file.txt", "content", "utf16le");
    });
  });

  describe("listdir method", () => {
    it("should list directory contents without recursion", async () => {
      const mockEntries: FSEntry[] = [
        { name: "file1.txt", path: "/path/file1.txt", type: "file" },
        { name: "dir1", path: "/path/dir1", type: "directory" },
      ];
      vi.mocked(mockBridge.listdir).mockResolvedValue(mockEntries);

      const result = await mockBridge.listdir("/path");
      expect(result).toEqual(mockEntries);
      expect(mockBridge.listdir).toHaveBeenCalledWith("/path");
    });

    it("should list directory contents with recursion", async () => {
      const mockEntries: FSEntry[] = [
        { name: "file1.txt", path: "/path/file1.txt", type: "file" },
        { name: "file2.txt", path: "/path/subdir/file2.txt", type: "file" },
      ];
      vi.mocked(mockBridge.listdir).mockResolvedValue(mockEntries);

      const result = await mockBridge.listdir("/path", true);
      expect(result).toEqual(mockEntries);
      expect(mockBridge.listdir).toHaveBeenCalledWith("/path", true);
    });
  });

  describe("mkdir method", () => {
    it("should create directory", async () => {
      await mockBridge.mkdir("/path/to/dir");
      expect(mockBridge.mkdir).toHaveBeenCalledWith("/path/to/dir");
    });
  });

  describe("stat method", () => {
    it("should return file stats", async () => {
      const mockStats: FSStats = {
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date("2023-01-01"),
        size: 1024,
      };
      vi.mocked(mockBridge.stat).mockResolvedValue(mockStats);

      const result = await mockBridge.stat("/path/to/file.txt");
      expect(result).toEqual(mockStats);
      expect(mockBridge.stat).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should return directory stats", async () => {
      const mockStats: FSStats = {
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date("2023-01-01"),
        size: 0,
      };
      vi.mocked(mockBridge.stat).mockResolvedValue(mockStats);

      const result = await mockBridge.stat("/path/to/dir");
      expect(result).toEqual(mockStats);
      expect(result.isDirectory()).toBe(true);
      expect(result.isFile()).toBe(false);
    });
  });

  describe("exists method", () => {
    it("should return true when path exists", async () => {
      vi.mocked(mockBridge.exists).mockResolvedValue(true);

      const result = await mockBridge.exists("/path/to/file.txt");
      expect(result).toBe(true);
      expect(mockBridge.exists).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should return false when path does not exist", async () => {
      vi.mocked(mockBridge.exists).mockResolvedValue(false);

      const result = await mockBridge.exists("/path/to/nonexistent.txt");
      expect(result).toBe(false);
      expect(mockBridge.exists).toHaveBeenCalledWith("/path/to/nonexistent.txt");
    });
  });

  describe("rm method", () => {
    it("should remove file without options", async () => {
      await mockBridge.rm("/path/to/file.txt");
      expect(mockBridge.rm).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should remove directory with recursive option", async () => {
      const options: FileSystemBridgeRmOptions = { recursive: true };
      await mockBridge.rm("/path/to/dir", options);
      expect(mockBridge.rm).toHaveBeenCalledWith("/path/to/dir", options);
    });

    it("should remove with force option", async () => {
      const options: FileSystemBridgeRmOptions = { force: true };
      await mockBridge.rm("/path/to/file.txt", options);
      expect(mockBridge.rm).toHaveBeenCalledWith("/path/to/file.txt", options);
    });

    it("should remove with both recursive and force options", async () => {
      const options: FileSystemBridgeRmOptions = { recursive: true, force: true };
      await mockBridge.rm("/path/to/dir", options);
      expect(mockBridge.rm).toHaveBeenCalledWith("/path/to/dir", options);
    });
  });
});

describe("fSStats interface", () => {
  it("should correctly identify file type", () => {
    const fileStats: FSStats = {
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date(),
      size: 1024,
    };

    expect(fileStats.isFile()).toBe(true);
    expect(fileStats.isDirectory()).toBe(false);
  });

  it("should correctly identify directory type", () => {
    const dirStats: FSStats = {
      isFile: () => false,
      isDirectory: () => true,
      mtime: new Date(),
      size: 0,
    };

    expect(dirStats.isFile()).toBe(false);
    expect(dirStats.isDirectory()).toBe(true);
  });

  it("should have correct mtime and size properties", () => {
    const testDate = new Date("2023-01-01");
    const stats: FSStats = {
      isFile: () => true,
      isDirectory: () => false,
      mtime: testDate,
      size: 2048,
    };

    expect(stats.mtime).toBe(testDate);
    expect(stats.size).toBe(2048);
  });
});

describe("fSEntry interface", () => {
  it("should have correct properties for file entry", () => {
    const fileEntry: FSEntry = {
      name: "document.txt",
      path: "/home/user/document.txt",
      type: "file",
    };

    expect(fileEntry.name).toBe("document.txt");
    expect(fileEntry.path).toBe("/home/user/document.txt");
    expect(fileEntry.type).toBe("file");
  });

  it("should have correct properties for directory entry", () => {
    const dirEntry: FSEntry = {
      name: "documents",
      path: "/home/user/documents",
      type: "directory",
    };

    expect(dirEntry.name).toBe("documents");
    expect(dirEntry.path).toBe("/home/user/documents");
    expect(dirEntry.type).toBe("directory");
  });
});
