import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import path from "node:path";
import { mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createPathFilter } from "@ucdjs/utils";
import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { validateUCDFiles } from "../../src/ucd-files";

describe("validateUCDFiles", () => {
  const MOCK_UCD_FILES = [
    {
      name: "UnicodeData.txt",
      path: "UnicodeData.txt",
    },
    {
      name: "Blocks.txt",
      path: "Blocks.txt",
    },
    {
      name: "emojis",
      path: "emojis",
      children: [
        {
          name: "emoji-data.txt",
          path: "emoji-data.txt",
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("basic validation functionality", () => {
    it("should identify missing files correctly", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual(
        expect.arrayContaining(["Blocks.txt", "emojis/emoji-data.txt"]),
      );
      expect(result.missingFiles).toHaveLength(2);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should return empty arrays when all files are present", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
          "Blocks.txt": "test content",
          "emojis": {
            "emoji-data.txt": "test content",
          },
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should identify extra files that are not required", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
          "Blocks.txt": "test content",
          "ExtraFile.txt": "extra content",
          "emojis": {
            "emoji-data.txt": "test content",
            "extra-emoji.txt": "extra content",
          },
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toContain("ExtraFile.txt");
      expect(result.notRequiredFiles).toContain("emojis/extra-emoji.txt");
    });

    it("should handle completely empty directory", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {},
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual([
        "UnicodeData.txt",
        "Blocks.txt",
        "emojis/emoji-data.txt",
      ]);
      expect(result.notRequiredFiles).toEqual([]);
    });
  });

  describe("pattern filtering", () => {
    it("should apply pattern filters when validating", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
          "Blocks.txt": "test content",
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        patterns: ["!**/emoji*"],
      });

      // Should not include emoji files in missing files since they're filtered out
      expect(result.missingFiles).not.toContain("emojis/emoji-data.txt");
      expect(result.missingFiles).toEqual([]);
    });

    it("should use custom pattern matcher function", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      // Custom matcher that only allows UnicodeData.txt
      const customPatternMatcher = createPathFilter(["**/UnicodeData.txt"]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        patternMatcher: customPatternMatcher,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should prioritize patternMatcher over patterns array", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
          "Blocks.txt": "test content",
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      // Custom matcher that allows everything
      const customPatternMatcher = createPathFilter(["**/*"]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        patternMatcher: customPatternMatcher,
        patterns: ["!**/*"], // This should be ignored
      });

      expect(result.missingFiles).toEqual(["emojis/emoji-data.txt"]);
    });
  });

  describe("configuration options", () => {
    it("should use custom API URL when provided", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
        },
      });

      const customApiUrl = "https://custom-api.example.com";

      mockFetch([
        [`GET ${customApiUrl}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        apiUrl: customApiUrl,
      });

      expect(result.missingFiles).toEqual([
        "Blocks.txt",
        "emojis/emoji-data.txt",
      ]);
    });

    it("should use custom filesystem adapter", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
        },
      });

      const mockFs = {
        read: vi.fn().mockResolvedValue("test content"),
        mkdir: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue(["UnicodeData.txt"]),
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
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        fs: mockFs,
      });

      expect(mockFs.listdir).toHaveBeenCalledWith(
        path.join(testdirPath, "v16.0.0"),
        true,
      );

      expect(result.missingFiles).toEqual([
        "Blocks.txt",
        "emojis/emoji-data.txt",
      ]);
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      const testdirPath = await testdir({
        "v99.0.0": {},
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/99.0.0`, () => {
          return new HttpResponse(null, { status: 404, statusText: "Not Found" });
        }],
      ]);

      const result = await validateUCDFiles("99.0.0", {
        basePath: testdirPath,
      });

      // Should return empty arrays on error (based on the catch block implementation)
      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should handle invalid API response format", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {},
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json("not an array");
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should handle filesystem errors gracefully", async () => {
      const testdirPath = await testdir({});

      const mockFs = {
        read: vi.fn().mockResolvedValue("test content"),
        mkdir: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockRejectedValue(new Error("Permission denied")),
        stat: vi.fn().mockResolvedValue({
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          size: 1234,
        }),
        rm: vi.fn().mockResolvedValue(undefined),
      } satisfies FileSystemBridge;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        fs: mockFs,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should handle missing version directory", async () => {
      const testdirPath = await testdir({});

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      // Should handle the case where the version directory doesn't exist
      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });
  });

  describe("nested file structures", () => {
    it("should handle deeply nested file structures", async () => {
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
                  name: "deep-file.txt",
                  path: "deep-file.txt",
                },
              ],
            },
          ],
        },
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
      ];

      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
          "level1": {
            level2: {
              "deep-file.txt": "deep content",
            },
          },
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(nestedFileEntries);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toEqual([]);
    });

    it("should identify missing files in nested structures", async () => {
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
                  name: "deep-file.txt",
                  path: "deep-file.txt",
                },
                {
                  name: "another-deep-file.txt",
                  path: "another-deep-file.txt",
                },
              ],
            },
          ],
        },
      ];

      const testdirPath = await testdir({
        "v16.0.0": {
          level1: {
            level2: {
              "deep-file.txt": "deep content",
              // missing another-deep-file.txt
            },
          },
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(nestedFileEntries);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toContain("level1/level2/another-deep-file.txt");
    });
  });

  describe("edge cases", () => {
    it("should handle empty file list from API", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "SomeFile.txt": "content",
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.notRequiredFiles).toContain("SomeFile.txt");
    });

    it("should work with empty patterns array", async () => {
      const testdirPath = await testdir({
        "v16.0.0": {
          "UnicodeData.txt": "test content",
        },
      });

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/16.0.0`, () => {
          return HttpResponse.json(MOCK_UCD_FILES);
        }],
      ]);

      const result = await validateUCDFiles("16.0.0", {
        basePath: testdirPath,
        patterns: [],
      });

      expect(result.missingFiles).toEqual([
        "Blocks.txt",
        "emojis/emoji-data.txt",
      ]);
    });
  });
});
