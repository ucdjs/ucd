/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createFileTree, mockStoreApi } from "#test-utils/mock-store";
import { describe, expect, it } from "vitest";
import { compare } from "../../src/reports/compare";

describe("compare", () => {
  const UNICODE_DATA_V16 = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";
  const UNICODE_DATA_V15 = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";
  // Use content that differs in the data portion (not just header) to properly test hash comparison
  const BLOCKS_V16 = "# Blocks-16.0.0.txt\n0000..007F; Basic Latin\n0080..00FF; Latin-1 Supplement";
  const BLOCKS_V15 = "# Blocks-15.1.0.txt\n0000..007F; Basic Latin";

  describe("basic comparison", () => {
    it("should compare two versions with identical files", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.from).toBe("15.1.0");
      expect(data?.to).toBe("16.0.0");
      expect(data?.added).toHaveLength(0);
      expect(data?.removed).toHaveLength(0);
      expect(data?.modified).toHaveLength(0);
      expect(data?.unchanged).toBe(1);
    });

    it("should detect added files", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
            "NewFile.txt": "new file content",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "16.0.0/NewFile.txt": "new file content",
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toContain("NewFile.txt");
      expect(data?.added).toHaveLength(1);
      expect(data?.removed).toHaveLength(0);
    });

    it("should detect removed files", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
            "OldFile.txt": "old file content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
          "15.1.0/OldFile.txt": "old file content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.removed).toContain("OldFile.txt");
      expect(data?.removed).toHaveLength(1);
      expect(data?.added).toHaveLength(0);
    });

    it("should detect modified files", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "Blocks.txt": BLOCKS_V16,
          }),
          "15.1.0": createFileTree({
            "Blocks.txt": BLOCKS_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/Blocks.txt": BLOCKS_V16,
          "15.1.0/Blocks.txt": BLOCKS_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.modified).toContain("Blocks.txt");
      expect(data?.modified).toHaveLength(1);
      expect(data?.unchanged).toBe(0);
    });
  });

  describe("combined changes", () => {
    it("should detect added, removed, and modified files together", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
            "Blocks.txt": "v16 blocks content changed",
            "NewInV16.txt": "new file",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
            "Blocks.txt": "v15 blocks content original",
            "RemovedInV16.txt": "removed file",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "16.0.0/Blocks.txt": "v16 blocks content changed",
          "16.0.0/NewInV16.txt": "new file",
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
          "15.1.0/Blocks.txt": "v15 blocks content original",
          "15.1.0/RemovedInV16.txt": "removed file",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toContain("NewInV16.txt");
      expect(data?.removed).toContain("RemovedInV16.txt");
      expect(data?.modified).toContain("Blocks.txt");
      expect(data?.unchanged).toBe(1); // UnicodeData.txt unchanged
    });
  });

  describe("file changes detail", () => {
    it("should include file size information in changes", async () => {
      const smallContent = "small";
      const largeContent = "this is a much larger content string for comparison";

      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "GrowingFile.txt": largeContent,
          }),
          "15.1.0": createFileTree({
            "GrowingFile.txt": smallContent,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/GrowingFile.txt": largeContent,
          "15.1.0/GrowingFile.txt": smallContent,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.changes).toHaveLength(1);
      const change = data?.changes[0];
      expect(change?.file).toBe("GrowingFile.txt");
      expect(change?.from.size).toBe(new TextEncoder().encode(smallContent).length);
      expect(change?.to.size).toBe(new TextEncoder().encode(largeContent).length);
    });

    it("should sort changes alphabetically by file path", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "Zebra.txt": "v16 zebra",
            "Alpha.txt": "v16 alpha",
            "Middle.txt": "v16 middle",
          }),
          "15.1.0": createFileTree({
            "Zebra.txt": "v15 zebra",
            "Alpha.txt": "v15 alpha",
            "Middle.txt": "v15 middle",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/Zebra.txt": "v16 zebra",
          "16.0.0/Alpha.txt": "v16 alpha",
          "16.0.0/Middle.txt": "v16 middle",
          "15.1.0/Zebra.txt": "v15 zebra",
          "15.1.0/Alpha.txt": "v15 alpha",
          "15.1.0/Middle.txt": "v15 middle",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.modified).toEqual(["Alpha.txt", "Middle.txt", "Zebra.txt"]);
      expect(data?.changes.map((c) => c.file)).toEqual(["Alpha.txt", "Middle.txt", "Zebra.txt"]);
    });
  });

  describe("includeFileHashes option", () => {
    it("should skip hash comparison when includeFileHashes is false", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "Blocks.txt": BLOCKS_V16,
          }),
          "15.1.0": createFileTree({
            "Blocks.txt": BLOCKS_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/Blocks.txt": BLOCKS_V16,
          "15.1.0/Blocks.txt": BLOCKS_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        includeFileHashes: false,
      });

      expect(error).toBeNull();
      // When hashes are disabled, all common files are counted as unchanged
      expect(data?.modified).toHaveLength(0);
      expect(data?.unchanged).toBe(1);
      expect(data?.changes).toHaveLength(0);
    });

    it("should compare hashes by default", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "Blocks.txt": BLOCKS_V16,
          }),
          "15.1.0": createFileTree({
            "Blocks.txt": BLOCKS_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/Blocks.txt": BLOCKS_V16,
          "15.1.0/Blocks.txt": BLOCKS_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        // includeFileHashes defaults to true
      });

      expect(error).toBeNull();
      expect(data?.modified).toContain("Blocks.txt");
    });
  });

  describe("snapshot.json handling", () => {
    it("should exclude snapshot.json from comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "16.0.0/snapshot.json": "{\"unicodeVersion\": \"16.0.0\"}",
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
          "15.1.0/snapshot.json": "{\"unicodeVersion\": \"15.1.0\"}",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      // snapshot.json should not appear in any category
      expect(data?.added).not.toContain("snapshot.json");
      expect(data?.removed).not.toContain("snapshot.json");
      expect(data?.modified).not.toContain("snapshot.json");
    });
  });

  describe("nested directories", () => {
    it("should compare files in nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
            "auxiliary": {
              "GraphemeBreakProperty.txt": "v16 grapheme content",
              "NewAuxFile.txt": "new aux file",
            },
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
            "auxiliary": {
              "GraphemeBreakProperty.txt": "v15 grapheme content",
              "OldAuxFile.txt": "old aux file",
            },
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "16.0.0/auxiliary/GraphemeBreakProperty.txt": "v16 grapheme content",
          "16.0.0/auxiliary/NewAuxFile.txt": "new aux file",
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
          "15.1.0/auxiliary/GraphemeBreakProperty.txt": "v15 grapheme content",
          "15.1.0/auxiliary/OldAuxFile.txt": "old aux file",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toContain("auxiliary/NewAuxFile.txt");
      expect(data?.removed).toContain("auxiliary/OldAuxFile.txt");
      expect(data?.modified).toContain("auxiliary/GraphemeBreakProperty.txt");
    });
  });

  describe("filter patterns", () => {
    it("should apply include filter to comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16",
            "Blocks.txt": "v16 blocks",
            "Scripts.txt": "v16 scripts",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15",
            "Blocks.txt": "v15 blocks",
            "Scripts.txt": "v15 scripts",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16",
          "16.0.0/Blocks.txt": "v16 blocks",
          "16.0.0/Scripts.txt": "v16 scripts",
          "15.1.0/UnicodeData.txt": "v15",
          "15.1.0/Blocks.txt": "v15 blocks",
          "15.1.0/Scripts.txt": "v15 scripts",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        filters: {
          include: ["UnicodeData.txt", "Blocks.txt"],
        },
      });

      expect(error).toBeNull();
      // Only included files should be compared
      expect(data?.modified).toContain("UnicodeData.txt");
      expect(data?.modified).toContain("Blocks.txt");
      expect(data?.modified).not.toContain("Scripts.txt");
    });

    it("should apply exclude filter to comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16",
            "Blocks.txt": "v16 blocks",
            "Scripts.txt": "v16 scripts",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15",
            "Blocks.txt": "v15 blocks",
            "Scripts.txt": "v15 scripts",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16",
          "16.0.0/Blocks.txt": "v16 blocks",
          "16.0.0/Scripts.txt": "v16 scripts",
          "15.1.0/UnicodeData.txt": "v15",
          "15.1.0/Blocks.txt": "v15 blocks",
          "15.1.0/Scripts.txt": "v15 scripts",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        filters: {
          exclude: ["Scripts.txt"],
        },
      });

      expect(error).toBeNull();
      // Scripts.txt should be excluded from comparison
      expect(data?.modified).not.toContain("Scripts.txt");
      expect(data?.modified).toContain("UnicodeData.txt");
      expect(data?.modified).toContain("Blocks.txt");
    });
  });

  describe("validation errors", () => {
    it("should error when options are missing", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [data, error] = await compare(context, undefined as any);

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toContain("Options");
    });

    it("should error when from version is missing", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [data, error] = await compare(context, {
        from: "",
        to: "16.0.0",
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it("should error when to version is missing", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "",
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it("should error when from version is not resolved", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await compare(context, {
        from: "99.0.0",
        to: "16.0.0",
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toContain("99.0.0");
    });

    it("should error when to version is not resolved", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await compare(context, {
        from: "16.0.0",
        to: "99.0.0",
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toContain("99.0.0");
    });
  });

  describe("comparison modes", () => {
    it("should work with prefer-local mode (default)", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        mode: "prefer-local",
      });

      expect(error).toBeNull();
      expect(data?.unchanged).toBe(1);
    });

    it("should work with local mode", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        mode: "local",
      });

      expect(error).toBeNull();
      expect(data?.unchanged).toBe(1);
    });

    it("should work with tuple mode for different from/to modes", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V15,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
          "15.1.0/UnicodeData.txt": UNICODE_DATA_V15,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        mode: ["local", "prefer-local"],
      });

      expect(error).toBeNull();
      expect(data?.unchanged).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle empty file lists", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": [],
          "15.1.0": [],
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        // No files
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toHaveLength(0);
      expect(data?.removed).toHaveLength(0);
      expect(data?.modified).toHaveLength(0);
      expect(data?.unchanged).toBe(0);
    });

    it("should handle comparing same version to itself", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_V16,
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_V16,
        },
      });

      const [data, error] = await compare(context, {
        from: "16.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toHaveLength(0);
      expect(data?.removed).toHaveLength(0);
      expect(data?.modified).toHaveLength(0);
      expect(data?.unchanged).toBe(1);
    });

    it("should sort added files alphabetically", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "Zebra.txt": "content",
            "Alpha.txt": "content",
            "Middle.txt": "content",
          }),
          "15.1.0": [],
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/Zebra.txt": "content",
          "16.0.0/Alpha.txt": "content",
          "16.0.0/Middle.txt": "content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toEqual(["Alpha.txt", "Middle.txt", "Zebra.txt"]);
    });

    it("should sort removed files alphabetically", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": [],
          "15.1.0": createFileTree({
            "Zebra.txt": "content",
            "Alpha.txt": "content",
            "Middle.txt": "content",
          }),
        },
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "15.1.0/Zebra.txt": "content",
          "15.1.0/Alpha.txt": "content",
          "15.1.0/Middle.txt": "content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.removed).toEqual(["Alpha.txt", "Middle.txt", "Zebra.txt"]);
    });
  });
});
