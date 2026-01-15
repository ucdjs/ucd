/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import type { FileChangeInfo } from "../../src/reports/compare";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createFileTree, mockStoreApi } from "#test-utils/mock-store";
import { describe, expect, it } from "vitest";
import { compare } from "../../src/reports/compare";

function findChange(changes: readonly FileChangeInfo[], fileName: string): FileChangeInfo | undefined {
  return changes.find((c) => c.file === fileName || c.file.endsWith(`/${fileName}`));
}

describe("compare", () => {
  describe("basic comparison", () => {
    it("should compare two versions with identical files", async () => {
      const content = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";

      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": content,
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": content,
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": content,
          "15.1.0/UnicodeData.txt": content,
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
            "UnicodeData.txt": "v16 content",
            "NewFile.txt": "new file content",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15 content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16 content",
          "16.0.0/NewFile.txt": "new file content",
          "15.1.0/UnicodeData.txt": "v15 content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toContain("NewFile.txt");
      expect(data?.removed).toHaveLength(0);
    });

    it("should detect removed files", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16 content",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15 content",
            "OldFile.txt": "old file content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16 content",
          "15.1.0/UnicodeData.txt": "v15 content",
          "15.1.0/OldFile.txt": "old file content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.removed).toContain("OldFile.txt");
      expect(data?.added).toHaveLength(0);
    });

    it("should detect modified files with content changes", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "modified content for v16",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "original content for v15",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "modified content for v16",
          "15.1.0/UnicodeData.txt": "original content for v15",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.modified).toContain("UnicodeData.txt");
      expect(data?.unchanged).toBe(0);

      const change = findChange(data?.changes ?? [], "UnicodeData.txt");
      expect(change).toBeDefined();
      expect(change?.changeType).toBe("content-changed");
      expect(change?.from.hash).not.toBe(change?.to.hash);
    });
  });

  describe("hash comparison details", () => {
    it("should include hash and size in change info", async () => {
      const v15Content = "# DerivedBinaryProperties-15.1.0.txt\n# Date: 2023-01-05\noriginal data";
      const v16Content = "# DerivedBinaryProperties-16.0.0.txt\n# Date: 2024-01-05\nmodified data";

      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "DerivedBinaryProperties.txt": v16Content,
          }),
          "15.1.0": createFileTree({
            "DerivedBinaryProperties.txt": v15Content,
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/DerivedBinaryProperties.txt": v16Content,
          "15.1.0/DerivedBinaryProperties.txt": v15Content,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.modified).toContain("DerivedBinaryProperties.txt");

      const change = findChange(data?.changes ?? [], "DerivedBinaryProperties.txt");
      expect(change).toBeDefined();
      expect(change?.from.hash).toMatch(/^sha256:/);
      expect(change?.to.hash).toMatch(/^sha256:/);
      expect(change?.from.size).toBeGreaterThan(0);
      expect(change?.to.size).toBeGreaterThan(0);
    });

    it("should treat files with only header changes as unchanged", async () => {
      const v15Content = "# File-15.1.0.txt\n# Date: 2023-01-05\n# © 2023 Unicode®, Inc.\nactual data content";
      const v16Content = "# File-16.0.0.txt\n# Date: 2024-01-05\n# © 2024 Unicode®, Inc.\nactual data content";

      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "File.txt": v16Content,
          }),
          "15.1.0": createFileTree({
            "File.txt": v15Content,
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/File.txt": v16Content,
          "15.1.0/File.txt": v15Content,
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.modified).toHaveLength(0);
      expect(data?.unchanged).toBe(1);
    });
  });

  describe("includeFileHashes option", () => {
    it("should skip hash comparison when includeFileHashes is false", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16 different content",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15 content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16 different content",
          "15.1.0/UnicodeData.txt": "v15 content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        includeFileHashes: false,
      });

      expect(error).toBeNull();
      expect(data?.modified).toHaveLength(0);
      expect(data?.unchanged).toBe(1);
      expect(data?.changes).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should throw error when options are missing", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [, error] = await compare(context);

      expect(error).toBeDefined();
      expect(error?.message).toContain("Options with `from` and `to` versions are required");
    });

    it("should throw error when from version is missing", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [, error] = await compare(context, {
        from: "",
        to: "16.0.0",
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("Both `from` and `to` versions must be specified");
    });

    it("should throw error when to version is missing", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
      });

      const [, error] = await compare(context, {
        from: "15.1.0",
        to: "",
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("Both `from` and `to` versions must be specified");
    });

    it("should throw error when from version is not in store", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("15.1.0");
    });

    it("should throw error when to version is not in store", async () => {
      const { context } = await createTestContext({
        versions: ["15.1.0"],
      });

      const [, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("16.0.0");
    });
  });

  describe("nested directories", () => {
    it("should compare files in nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "root content",
            "auxiliary": {
              "GraphemeBreakProperty.txt": "v16 gbp content",
              "WordBreakProperty.txt": "wbp content",
            },
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "root content",
            "auxiliary": {
              "GraphemeBreakProperty.txt": "v15 gbp content",
              "WordBreakProperty.txt": "wbp content",
            },
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "root content",
          "16.0.0/auxiliary/GraphemeBreakProperty.txt": "v16 gbp content",
          "16.0.0/auxiliary/WordBreakProperty.txt": "wbp content",
          "15.1.0/UnicodeData.txt": "root content",
          "15.1.0/auxiliary/GraphemeBreakProperty.txt": "v15 gbp content",
          "15.1.0/auxiliary/WordBreakProperty.txt": "wbp content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.modified.some((f) => f.includes("GraphemeBreakProperty.txt"))).toBe(true);
      expect(data?.unchanged).toBe(2);
    });

    it("should detect added files in nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            auxiliary: {
              "GraphemeBreakProperty.txt": "content",
              "NewNestedFile.txt": "new nested content",
            },
          }),
          "15.1.0": createFileTree({
            auxiliary: {
              "GraphemeBreakProperty.txt": "content",
            },
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/auxiliary/GraphemeBreakProperty.txt": "content",
          "16.0.0/auxiliary/NewNestedFile.txt": "new nested content",
          "15.1.0/auxiliary/GraphemeBreakProperty.txt": "content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added.some((f) => f.includes("NewNestedFile.txt"))).toBe(true);
    });
  });

  describe("filter patterns", () => {
    it("should apply include filter to comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16 content",
            "Blocks.txt": "v16 blocks",
            "Scripts.txt": "v16 scripts",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15 content",
            "Blocks.txt": "v15 blocks",
            "Scripts.txt": "v15 scripts",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16 content",
          "16.0.0/Blocks.txt": "v16 blocks",
          "16.0.0/Scripts.txt": "v16 scripts",
          "15.1.0/UnicodeData.txt": "v15 content",
          "15.1.0/Blocks.txt": "v15 blocks",
          "15.1.0/Scripts.txt": "v15 scripts",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        filters: {
          include: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data?.modified).toHaveLength(1);
      expect(data?.modified).toContain("UnicodeData.txt");
      expect(data?.modified).not.toContain("Blocks.txt");
      expect(data?.modified).not.toContain("Scripts.txt");
    });

    it("should apply exclude filter to comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16 content",
            "Blocks.txt": "v16 blocks",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15 content",
            "Blocks.txt": "v15 blocks",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16 content",
          "16.0.0/Blocks.txt": "v16 blocks",
          "15.1.0/UnicodeData.txt": "v15 content",
          "15.1.0/Blocks.txt": "v15 blocks",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        filters: {
          exclude: ["Blocks.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data?.modified).toContain("UnicodeData.txt");
      expect(data?.modified).not.toContain("Blocks.txt");
    });
  });

  describe("comparison modes", () => {
    it("should support local mode for both versions", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "v16 content",
          "15.1.0/UnicodeData.txt": "v15 content",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        mode: "local",
      });

      expect(error).toBeNull();
      expect(data?.modified).toContain("UnicodeData.txt");
    });

    it("should support tuple mode with different modes for from/to", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16 content from api",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "v15 content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "15.1.0/UnicodeData.txt": "v15 content",
          "16.0.0/UnicodeData.txt": "v16 content from api",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
        mode: ["local", "prefer-local"],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("snapshot.json exclusion", () => {
    it("should exclude snapshot.json from comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "content",
          }),
          "15.1.0": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/snapshot.json": "{\"unicodeVersion\": \"16.0.0\"}",
          "15.1.0/UnicodeData.txt": "content",
          "15.1.0/snapshot.json": "{\"unicodeVersion\": \"15.1.0\"}",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).not.toContain("snapshot.json");
      expect(data?.removed).not.toContain("snapshot.json");
      expect(data?.modified).not.toContain("snapshot.json");
    });
  });

  describe("complex comparison scenarios", () => {
    it("should handle all change types in a single comparison", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "Unchanged.txt": "same content",
            "Modified.txt": "modified in v16",
            "Added.txt": "new file in v16",
          }),
          "15.1.0": createFileTree({
            "Unchanged.txt": "same content",
            "Modified.txt": "original in v15",
            "Removed.txt": "will be removed",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        initialFiles: {
          "16.0.0/Unchanged.txt": "same content",
          "16.0.0/Modified.txt": "modified in v16",
          "16.0.0/Added.txt": "new file in v16",
          "15.1.0/Unchanged.txt": "same content",
          "15.1.0/Modified.txt": "original in v15",
          "15.1.0/Removed.txt": "will be removed",
        },
      });

      const [data, error] = await compare(context, {
        from: "15.1.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data?.added).toContain("Added.txt");
      expect(data?.removed).toContain("Removed.txt");
      expect(data?.modified).toContain("Modified.txt");
      expect(data?.unchanged).toBe(1);
      expect(data?.changes).toHaveLength(1);
    });
  });
});
