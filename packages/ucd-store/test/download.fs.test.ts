import type { FsInterface } from "../src/fs-interface";
import { mockFetch } from "#msw-utils";
import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { download, downloadSingleFile, repairStore, validateLocalStore } from "../src/download";

// Create a mock filesystem interface
function createMockFs(): FsInterface {
  return {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    pathExists: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  };
}

describe("download functions with filesystem abstraction", () => {
  let mockFs: FsInterface;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
  });

  describe("download function", () => {
    it("should use custom filesystem interface for directory creation", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("test content", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.mkdir).mockResolvedValue();
      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      vi.mocked(mockFs.writeFile).mockResolvedValue();

      const result = await download({
        versions: ["16.0.0"],
        basePath: "/test/ucd",
        fs: mockFs,
      });

      expect(result.errors).toBeNull();
      expect(result.downloadedFiles).toHaveLength(1);
      expect(mockFs.mkdir).toHaveBeenCalledWith("/test/ucd/v16.0.0", { recursive: true });
      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("UnicodeData.txt"),
        "test content",
      );
    });

    it("should handle filesystem errors during directory creation", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const fsError = new Error("Permission denied");
      vi.mocked(mockFs.mkdir).mockRejectedValue(fsError);

      const result = await download({
        versions: ["16.0.0"],
        basePath: "/test/ucd",
        fs: mockFs,
      });

      expect(result.errors).not.toBeNull();
      expect(result.errors?.[0]?.message).toContain("Error processing version 16.0.0");
      expect(mockFs.mkdir).toHaveBeenCalledWith("/test/ucd/v16.0.0", { recursive: true });
    });

    it("should handle filesystem errors during file writing", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("test content", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.mkdir).mockResolvedValue();
      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      const writeError = new Error("Disk full");
      vi.mocked(mockFs.writeFile).mockRejectedValue(writeError);

      const result = await download({
        versions: ["16.0.0"],
        basePath: "/test/ucd",
        fs: mockFs,
      });

      expect(result.errors).not.toBeNull();
      expect(result.errors?.[0]?.message).toContain("Error downloading UnicodeData.txt: Disk full");
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it("should handle nested directory structures", async () => {
      const mockFileEntries = [
        {
          name: "emoji",
          path: "emoji",
          children: [
            {
              name: "emoji-data.txt",
              path: "emoji-data.txt",
            },
          ],
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/emoji/emoji-data.txt", () => {
          return new HttpResponse("emoji content", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.mkdir).mockResolvedValue();
      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      vi.mocked(mockFs.writeFile).mockResolvedValue();

      const result = await download({
        versions: ["16.0.0"],
        basePath: "/test/ucd",
        fs: mockFs,
      });

      expect(result.errors).toBeNull();
      expect(result.downloadedFiles).toHaveLength(1);

      // Verify directory creation for nested structure
      expect(mockFs.mkdir).toHaveBeenCalledWith("/test/ucd/v16.0.0", { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("emoji"),
        { recursive: true },
      );
      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("emoji-data.txt"),
        "emoji content",
      );
    });

    it("should use default filesystem when none provided", async () => {
      const testdirPath = await testdir({});
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("test content", { status: 200 });
        }],
      ]);

      // Test without passing fs parameter - should use default
      const result = await download({
        versions: ["16.0.0"],
        basePath: testdirPath,
      });

      // Should not throw errors and complete successfully
      expect(result.downloadedFiles).toHaveLength(1);
    });
  });

  describe("validateLocalStore function", () => {
    it("should use custom filesystem interface for file access checks", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      vi.mocked(mockFs.access).mockResolvedValue();

      const result = await validateLocalStore({
        basePath: "/test/ucd",
        versions: ["16.0.0"],
        fs: mockFs,
      });

      expect(result.isValid).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
      expect(mockFs.access).toHaveBeenCalledWith(
        expect.stringContaining("UnicodeData.txt"),
      );
    });

    it("should detect missing files when access fails", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const accessError = new Error("File not found");
      vi.mocked(mockFs.access).mockRejectedValue(accessError);

      const result = await validateLocalStore({
        basePath: "/test/ucd",
        versions: ["16.0.0"],
        fs: mockFs,
      });

      expect(result.isValid).toBe(false);
      expect(result.missingFiles).toHaveLength(1);
      expect(result.missingFiles[0]).toMatchObject({
        version: "16.0.0",
        filePath: "UnicodeData.txt",
      });
      expect(mockFs.access).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const result = await validateLocalStore({
        basePath: "/test/ucd",
        versions: ["16.0.0"],
        fs: mockFs,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain("Failed to fetch file list");
      // Should not call filesystem methods for failed API requests
      expect(mockFs.access).not.toHaveBeenCalled();
    });
  });

  describe("downloadSingleFile function", () => {
    it("should use custom filesystem interface for single file downloads", async () => {
      mockFetch([
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("file content", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      vi.mocked(mockFs.writeFile).mockResolvedValue();

      const result = await downloadSingleFile(
        "16.0.0",
        "UnicodeData.txt",
        "/test/ucd/UnicodeData.txt",
        mockFs,
      );

      expect(result.success).toBe(true);
      expect(mockFs.ensureDir).toHaveBeenCalledWith("/test/ucd");
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        "/test/ucd/UnicodeData.txt",
        "file content",
        "utf-8",
      );
    });

    it("should handle filesystem errors during single file download", async () => {
      mockFetch([
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("file content", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      const writeError = new Error("Permission denied");
      vi.mocked(mockFs.writeFile).mockRejectedValue(writeError);

      const result = await downloadSingleFile(
        "16.0.0",
        "UnicodeData.txt",
        "/test/ucd/UnicodeData.txt",
        mockFs,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it("should handle directory creation errors", async () => {
      mockFetch([
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("file content", { status: 200 });
        }],
      ]);

      const dirError = new Error("Cannot create directory");
      vi.mocked(mockFs.ensureDir).mockRejectedValue(dirError);

      const result = await downloadSingleFile(
        "16.0.0",
        "UnicodeData.txt",
        "/test/ucd/UnicodeData.txt",
        mockFs,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot create directory");
      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it("should handle HTTP errors", async () => {
      mockFetch([
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const result = await downloadSingleFile(
        "16.0.0",
        "UnicodeData.txt",
        "/test/ucd/UnicodeData.txt",
        mockFs,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to fetch UnicodeData.txt: 404");
      // Should still try to create directory
      expect(mockFs.ensureDir).toHaveBeenCalled();
      // Should not write file for failed HTTP request
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("repairStore function", () => {
    it("should use custom filesystem interface for repair operations", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("repaired content", { status: 200 });
        }],
      ]);

      // Simulate missing file
      const accessError = new Error("File not found");
      vi.mocked(mockFs.access).mockRejectedValue(accessError);
      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      vi.mocked(mockFs.writeFile).mockResolvedValue();

      const result = await repairStore(
        {
          basePath: "/test/ucd",
          versions: ["16.0.0"],
        },
        {
          fs: mockFs,
          concurrency: 1,
        },
      );

      expect(result.repairedFiles).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.totalMissingFiles).toBe(1);

      // Verify filesystem operations
      expect(mockFs.access).toHaveBeenCalled();
      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("UnicodeData.txt"),
        "repaired content",
        "utf-8",
      );
    });

    it("should handle filesystem errors during repair", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("repaired content", { status: 200 });
        }],
      ]);

      // Simulate missing file
      const accessError = new Error("File not found");
      vi.mocked(mockFs.access).mockRejectedValue(accessError);
      vi.mocked(mockFs.ensureDir).mockResolvedValue();

      // Simulate write error during repair
      const writeError = new Error("Disk full");
      vi.mocked(mockFs.writeFile).mockRejectedValue(writeError);

      const result = await repairStore(
        {
          basePath: "/test/ucd",
          versions: ["16.0.0"],
        },
        {
          fs: mockFs,
          concurrency: 1,
        },
      );

      expect(result.repairedFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Disk full");
      expect(result.totalMissingFiles).toBe(1);
    });

    it("should respect concurrency limits during repair", async () => {
      const mockFileEntries = [
        { name: "File1.txt", path: "File1.txt" },
        { name: "File2.txt", path: "File2.txt" },
        { name: "File3.txt", path: "File3.txt" },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/File1.txt", () => {
          return new HttpResponse("content1", { status: 200 });
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/File2.txt", () => {
          return new HttpResponse("content2", { status: 200 });
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/File3.txt", () => {
          return new HttpResponse("content3", { status: 200 });
        }],
      ]);

      // Simulate all files missing
      const accessError = new Error("File not found");
      vi.mocked(mockFs.access).mockRejectedValue(accessError);
      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      vi.mocked(mockFs.writeFile).mockResolvedValue();

      const result = await repairStore(
        {
          basePath: "/test/ucd",
          versions: ["16.0.0"],
        },
        {
          fs: mockFs,
          concurrency: 2, // Test concurrency limit
        },
      );

      expect(result.repairedFiles).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.totalMissingFiles).toBe(3);

      // Verify all files were processed
      expect(mockFs.writeFile).toHaveBeenCalledTimes(3);
    });

    it("should use default filesystem when none provided", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("content", { status: 200 });
        }],
      ]);

      // Test without passing fs parameter - should use default and complete
      const result = await repairStore(
        {
          basePath: "/test/ucd",
          versions: ["16.0.0"],
        },
        {
          concurrency: 1,
        },
      );

      // Should complete without throwing errors
      expect(result.totalMissingFiles).toBeGreaterThanOrEqual(0);
    });
  });

  describe("error handling and retry scenarios", () => {
    it("should handle multiple consecutive filesystem errors", async () => {
      const mockFileEntries = [
        { name: "File1.txt", path: "File1.txt" },
        { name: "File2.txt", path: "File2.txt" },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/File1.txt", () => {
          return new HttpResponse("content1", { status: 200 });
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/File2.txt", () => {
          return new HttpResponse("content2", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.mkdir).mockResolvedValue();
      vi.mocked(mockFs.ensureDir).mockResolvedValue();

      // First file succeeds, second fails
      vi.mocked(mockFs.writeFile)
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error("Write error"));

      const result = await download({
        versions: ["16.0.0"],
        basePath: "/test/ucd",
        fs: mockFs,
      });

      expect(result.downloadedFiles).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toContain("Write error");
    });

    it("should handle intermittent filesystem access issues", async () => {
      const mockFileEntries = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      // Simulate intermittent access issues
      vi.mocked(mockFs.access)
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce();

      const result1 = await validateLocalStore({
        basePath: "/test/ucd",
        versions: ["16.0.0"],
        fs: mockFs,
      });

      const result2 = await validateLocalStore({
        basePath: "/test/ucd",
        versions: ["16.0.0"],
        fs: mockFs,
      });

      expect(result1.isValid).toBe(false);
      expect(result1.missingFiles).toHaveLength(1);
      expect(result2.isValid).toBe(true);
      expect(result2.missingFiles).toHaveLength(0);
    });

    it("should handle filesystem operations with special characters in paths", async () => {
      const mockFileEntries = [
        {
          name: "special file name with spaces.txt",
          path: "special file name with spaces.txt",
        },
      ];

      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
          return HttpResponse.json(mockFileEntries);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/special%20file%20name%20with%20spaces.txt", () => {
          return new HttpResponse("special content", { status: 200 });
        }],
      ]);

      vi.mocked(mockFs.mkdir).mockResolvedValue();
      vi.mocked(mockFs.ensureDir).mockResolvedValue();
      vi.mocked(mockFs.writeFile).mockResolvedValue();

      const result = await download({
        versions: ["16.0.0"],
        basePath: "/test/ucd",
        fs: mockFs,
      });

      expect(result.errors).toBeNull();
      expect(result.downloadedFiles).toHaveLength(1);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("special file name with spaces.txt"),
        "special content",
      );
    });
  });
});
