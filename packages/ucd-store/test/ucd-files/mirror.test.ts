import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createPathFilter } from "@ucdjs/utils";
import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { mirrorUCDFiles } from "../../src/ucd-files";

describe("mirrorUCDFiles", () => {
  const mockFileEntries = [
    {
      name: "UnicodeData.txt",
      path: "UnicodeData.txt",
    },
    {
      name: "ReadMe.txt",
      path: "ReadMe.txt",
    },
    {
      name: "auxiliary",
      path: "auxiliary",
      children: [
        {
          name: "GraphemeBreakProperty.txt",
          path: "GraphemeBreakProperty.txt",
        },
      ],
    },
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should return success when everything works correctly", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
      expect(result.locatedFiles).toContain("16.0.0/ReadMe.txt");
      expect(result.locatedFiles).toContain("16.0.0/auxiliary/GraphemeBreakProperty.txt");
      expect(result.locatedFiles).toContain("16.0.0/emoji/emoji-data.txt");
    });

    it("should handle multiple versions", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return HttpResponse.json([
            { name: "UnicodeData.txt", path: "UnicodeData.txt" },
            { name: "Blocks.txt", path: "Blocks.txt" },
          ]);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0", "15.1.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
      expect(result.locatedFiles).toContain("15.1.0/UnicodeData.txt");
      expect(result.locatedFiles).toContain("15.1.0/Blocks.txt");
    });

    it("should use custom API URL when provided", async () => {
      const testdirPath = await testdir({});
      const customApiUrl = "https://custom-api.example.com";

      mockFetch([
        [`GET ${customApiUrl}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        apiUrl: customApiUrl,
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("filtering functionality", () => {
    it("should apply pattern filters to exclude files", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        patterns: ["!**/ReadMe.txt"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
      expect(result.locatedFiles).not.toContain("16.0.0/ReadMe.txt");
      expect(result.locatedFiles).toContain("16.0.0/emoji/emoji-data.txt");
    });

    it("should use custom pattern matcher function", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      // Custom filter that only allows .txt files but excludes ReadMe
      const customPatternMatcher = createPathFilter(["**/*.txt", "!**/ReadMe.txt"]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        patternMatcher: customPatternMatcher,
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
      expect(result.locatedFiles).not.toContain("16.0.0/ReadMe.txt");
      expect(result.locatedFiles).toContain("16.0.0/auxiliary/GraphemeBreakProperty.txt");
      expect(result.locatedFiles).toContain("16.0.0/emoji/emoji-data.txt");
    });

    it("should prioritize patternMatcher over patterns array", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      // Custom matcher that allows everything
      const customPatternMatcher = createPathFilter(["**/*"]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        patternMatcher: customPatternMatcher,
        patterns: ["!**/*"], // This should be ignored
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles.length).toBeGreaterThan(0);
    });
  });

  describe("filesystem integration", () => {
    it("should use custom filesystem adapter", async () => {
      const testdirPath = await testdir({});

      const mockFs = {
        read: vi.fn().mockResolvedValue("test content"),
        mkdir: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        rm: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          size: 1234,
        }),
      } satisfies FileSystemBridge;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: testdirPath,
        fs: mockFs,
      });

      expect(result.success).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalledWith(`${testdirPath}/v16.0.0`);
    });

    it("should work with real filesystem using testdir", async () => {
      const outputPath = await testdir({});

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json([
            { name: "UnicodeData.txt", path: "UnicodeData.txt" },
          ]);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: outputPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
    });
  });

  describe("error handling", () => {
    it("should return error when no versions provided", async () => {
      const testdirPath = await testdir({});
      const result = await mirrorUCDFiles({
        versions: [],
        basePath: testdirPath,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toBe("No Unicode versions provided");
    });

    it("should handle API errors gracefully", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/99.0.0`, () => {
          return new HttpResponse(null, { status: 404, statusText: "Not Found" });
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["99.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toContain("Failed to fetch file list for version 99.0.0");
      expect(result.errors?.[0]?.version).toBe("99.0.0");
    });

    it("should handle invalid API response format", async () => {
      const testdirPath = await testdir({});

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json("not an array");
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toContain("Invalid response format for version 16.0.0");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const testdirPath = await testdir({});

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/99.0.0`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0", "99.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
      expect(result.errors?.[0]?.version).toBe("99.0.0");
    });

    it("should handle filesystem errors during directory creation", async () => {
      const testdirPath = await testdir({});

      const mockFs = {
        read: vi.fn().mockResolvedValue("test content"),
        mkdir: vi.fn().mockRejectedValue(new Error("Permission denied")),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        rm: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          size: 1234,
        }),
      } satisfies FileSystemBridge;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        fs: mockFs,
        basePath: testdirPath,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toContain("Error processing version 16.0.0");
      expect(result.errors?.[0]?.message).toContain("Permission denied");
    });
  });

  describe("configuration options", () => {
    it("should handle empty patterns array", async () => {
      const testdirPath = await testdir({});
      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(mockFileEntries);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        patterns: [],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles.length).toBeGreaterThan(0);
    });

    it("should work without any optional parameters", async () => {
      const testdirPath = await testdir({});

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json([{ name: "UnicodeData.txt", path: "UnicodeData.txt" }]);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
    });
  });

  describe("nested file structures", () => {
    it("should handle deeply nested file structures", async () => {
      const testdirPath = await testdir({});
      const nestedFileEntries = [
        {
          name: "level1",
          path: "level1",
          children: [
            {
              name: "level2",
              path: "level2",
              children: [
                {
                  name: "level3",
                  path: "level3",
                  children: [
                    {
                      name: "deep-file.txt",
                      path: "deep-file.txt",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(nestedFileEntries);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/16.0.0/ucd/level1/level2/level3/deep-file.txt`, () => {
          return new Response("deep-file.txt content");
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/level1/level2/level3/deep-file.txt");
    });

    it("should handle empty directories correctly", async () => {
      const testdirPath = await testdir({});
      const entriesWithEmptyDir = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
        {
          name: "empty-dir",
          path: "empty-dir",
          children: [],
        },
      ];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(entriesWithEmptyDir);
        }],
      ]);

      const result = await mirrorUCDFiles({
        versions: ["16.0.0"],
        basePath: testdirPath,
      });

      expect(result.success).toBe(true);
      expect(result.locatedFiles).toContain("16.0.0/UnicodeData.txt");
      expect(result.locatedFiles.some((f) => f.includes("empty-dir"))).toBe(false);
    });
  });
});
