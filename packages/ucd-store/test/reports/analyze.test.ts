/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import type { ReportFile } from "../../src/types/reports";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { createFileTree, mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import { analyze } from "../../src/reports/analyze";

/**
 * Helper to check if a file array contains a file with the given name.
 */
function hasFileName(files: ReportFile[] | undefined, name: string): boolean {
  return files?.some((f) => f.name === name) ?? false;
}

describe("analyze", () => {
  const UNICODE_DATA_CONTENT = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";
  const BLOCKS_CONTENT = "# Blocks-16.0.0.txt\n0000..007F; Basic Latin";

  // Standard responses needed for analyze tests

  describe("basic analysis", () => {
    it("should analyze a complete version with all files present", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": UNICODE_DATA_CONTENT,
            "Blocks.txt": BLOCKS_CONTENT,
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_CONTENT,
          "16.0.0/Blocks.txt": BLOCKS_CONTENT,
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(1);

      const report = data?.versions.get("16.0.0");
      expect(report).toBeDefined();
      expect(report?.version).toBe("16.0.0");
      expect(report?.isComplete).toBe(true);
      expect(hasFileName(report?.files.present, "UnicodeData.txt")).toBe(true);
      expect(hasFileName(report?.files.present, "Blocks.txt")).toBe(true);
      expect(report?.files.orphaned).toHaveLength(0);
      expect(report?.files.missing).toHaveLength(0);
    });

    it("should analyze multiple versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        files: {
          "16.0.0": createFileTree({
            "UnicodeData.txt": "v16 content",
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
          "15.1.0/UnicodeData.txt": "v15 content",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data?.versions.size).toBe(2);
      expect(data?.versions.has("16.0.0")).toBe(true);
      expect(data?.versions.has("15.1.0")).toBe(true);
    });

    it("should return empty map when no versions configured", async () => {
      const { context } = await createTestContext({
        versions: [],
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.versions.size).toBe(0);
    });
  });

  describe("missing files detection", () => {
    it("should detect missing files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          // Only UnicodeData.txt is present, Blocks.txt and Scripts.txt are missing
          "16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.present, "UnicodeData.txt")).toBe(true);
      expect(hasFileName(report?.files.missing, "Blocks.txt")).toBe(true);
      expect(hasFileName(report?.files.missing, "Scripts.txt")).toBe(true);
      expect(report?.counts.failed).toBe(2);
      expect(report?.counts.success).toBe(1);
    });

    it("should mark version as incomplete when files are missing", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          // Blocks.txt is missing
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.missing, "Blocks.txt")).toBe(true);
    });
  });

  describe("orphaned files detection", () => {
    it("should detect orphaned files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
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
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/OrphanedFile.txt": "this file is not expected",
          "16.0.0/AnotherOrphan.dat": "also not expected",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.orphaned, "OrphanedFile.txt")).toBe(true);
      expect(hasFileName(report?.files.orphaned, "AnotherOrphan.dat")).toBe(true);
      expect(report?.counts.skipped).toBe(2);
    });

    it("should mark version as incomplete when orphaned files exist", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/ExtraFile.txt": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.orphaned, "ExtraFile.txt")).toBe(true);
    });

    it("should not count snapshot.json as orphaned", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/snapshot.json": "{\"unicodeVersion\": \"16.0.0\", \"files\": {}}",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(true);
      expect(hasFileName(report?.files.orphaned, "snapshot.json")).toBe(false);
      expect(report?.counts.skipped).toBe(0);
    });
  });

  describe("mixed missing and orphaned files", () => {
    it("should detect both missing and orphaned files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          // Blocks.txt and Scripts.txt are missing
          "16.0.0/OrphanedFile.txt": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.present, "UnicodeData.txt")).toBe(true);
      expect(hasFileName(report?.files.missing, "Blocks.txt")).toBe(true);
      expect(hasFileName(report?.files.missing, "Scripts.txt")).toBe(true);
      expect(hasFileName(report?.files.orphaned, "OrphanedFile.txt")).toBe(true);
      expect(report?.counts.success).toBe(1);
      expect(report?.counts.failed).toBe(2);
      expect(report?.counts.skipped).toBe(1);
    });
  });

  describe("version filtering", () => {
    it("should only analyze specified versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "14.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "14.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "15.1.0/UnicodeData.txt": "content",
          "14.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await analyze(context, {
        versions: ["16.0.0", "15.1.0"],
      });

      expect(error).toBeNull();
      expect(data?.versions.size).toBe(2);
      expect(data?.versions.has("16.0.0")).toBe(true);
      expect(data?.versions.has("15.1.0")).toBe(true);
      expect(data?.versions.has("14.0.0")).toBe(false);
    });

    it("should skip versions not in resolved versions", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
        },
      });

      // Try to analyze version that doesn't exist in resolved versions
      const [data, error] = await analyze(context, {
        versions: ["99.0.0"],
      });

      expect(error).toBeNull();
      expect(data?.versions.size).toBe(0);
    });
  });

  describe("file types analysis", () => {
    it("should count files by extension", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
            "NamesList.html": "html content",
            "ReadMe.txt": "readme",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/Blocks.txt": "content",
          "16.0.0/Scripts.txt": "content",
          "16.0.0/NamesList.html": "html content",
          "16.0.0/ReadMe.txt": "readme",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.fileTypes).toBeDefined();
      expect(report?.fileTypes[".txt"]).toBe(4);
      expect(report?.fileTypes[".html"]).toBe(1);
    });

    it("should handle files without extensions", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "README": "content",
            "LICENSE": "content",
            "UnicodeData.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/README": "content",
          "16.0.0/LICENSE": "content",
          "16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      // eslint-disable-next-line dot-notation
      expect(report?.fileTypes["no_extension"]).toBe(2);
      expect(report?.fileTypes[".txt"]).toBe(1);
    });
  });

  describe("counts report", () => {
    it("should provide accurate counts", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
            "NamesList.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/Blocks.txt": "content",
          // Scripts.txt and NamesList.txt are missing
          "16.0.0/OrphanedFile.txt": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.counts.total).toBe(4);
      expect(report?.counts.success).toBe(2);
      expect(report?.counts.failed).toBe(2);
      expect(report?.counts.skipped).toBe(1);
    });
  });

  describe("nested directories", () => {
    it("should analyze files in nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "auxiliary": {
              "GraphemeBreakProperty.txt": "content",
              "WordBreakProperty.txt": "content",
            },
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/auxiliary/GraphemeBreakProperty.txt": "content",
          // WordBreakProperty.txt is missing
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.present, "UnicodeData.txt")).toBe(true);
      expect(hasFileName(report?.files.present, "auxiliary/GraphemeBreakProperty.txt")).toBe(true);
      expect(hasFileName(report?.files.missing, "auxiliary/WordBreakProperty.txt")).toBe(true);
    });

    it("should detect orphaned files in nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "auxiliary": {
              "GraphemeBreakProperty.txt": "content",
            },
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/auxiliary/GraphemeBreakProperty.txt": "content",
          "16.0.0/auxiliary/OrphanedNestedFile.txt": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      expect(report?.isComplete).toBe(false);
      expect(hasFileName(report?.files.orphaned, "auxiliary/OrphanedNestedFile.txt")).toBe(true);
    });
  });

  describe("filter patterns", () => {
    it("should apply include filter to analysis", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/Blocks.txt": "content",
          "16.0.0/Scripts.txt": "content",
        },
      });

      const [data, error] = await analyze(context, {
        filters: {
          include: ["UnicodeData.txt", "Blocks.txt"],
        },
      });

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      // With include filter, only included files are counted in actualFiles
      // Scripts.txt exists on disk but is filtered out from actual files
      // So it shows as "missing" (in expected but not in filtered actual)
      expect(hasFileName(report?.files.present, "UnicodeData.txt")).toBe(true);
      expect(hasFileName(report?.files.present, "Blocks.txt")).toBe(true);
      expect(hasFileName(report?.files.present, "Scripts.txt")).toBe(false);
      expect(hasFileName(report?.files.missing, "Scripts.txt")).toBe(true);
    });

    it("should apply exclude filter to analysis", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": createFileTree({
            "UnicodeData.txt": "content",
            "Blocks.txt": "content",
            "Scripts.txt": "content",
          }),
        },
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        } as const,
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/Blocks.txt": "content",
          "16.0.0/Scripts.txt": "content",
        },
      });

      const [data, error] = await analyze(context, {
        filters: {
          exclude: ["Scripts.txt"],
        },
      });

      expect(error).toBeNull();
      const report = data?.versions.get("16.0.0");
      // With exclude filter, Scripts.txt is filtered out of actualFiles
      // So it shows as "missing" (in expected but not in filtered actual)
      expect(hasFileName(report?.files.present, "UnicodeData.txt")).toBe(true);
      expect(hasFileName(report?.files.present, "Blocks.txt")).toBe(true);
      expect(hasFileName(report?.files.present, "Scripts.txt")).toBe(false);
      expect(hasFileName(report?.files.missing, "Scripts.txt")).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle manifest API errors gracefully", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": () => {
            return HttpResponse.json(
              { message: "Internal server error", status: 500, timestamp: new Date().toISOString() },
              { status: 500 },
            );
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await analyze(context);

      // Should propagate the error
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it("should handle manifest 404 errors", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": () => {
            return HttpResponse.json(
              { message: "Not found", status: 404, timestamp: new Date().toISOString() },
              { status: 404 },
            );
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await analyze(context);

      // Should propagate the error
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });
});
