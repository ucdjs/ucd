import type { AnalysisReport } from "../../src/reports/analyze";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { analyze } from "../../src/reports/analyze";

describe("analyze", () => {
  describe("complete versions", () => {
    it("should analyze complete version with all files present", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
              "ReadMe.txt",
            ],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/ReadMe.txt": "readme",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16).toEqual({
        version: "16.0.0",
        isComplete: true,
        fileTypes: {
          ".txt": 2,
        },
        counts: {
          expected: 2,
          present: 2,
          missing: 0,
          orphaned: 0,
        },
        files: {
          present: ["UnicodeData.txt", "ReadMe.txt"],
          orphaned: [],
          missing: [],
        },
      } satisfies AnalysisReport);
    });
  });

  describe("missing files", () => {
    it("should detect missing files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "ReadMe.txt",
              path: "ReadMe.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "ArabicShaping.txt",
              path: "ArabicShaping.txt",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16).toEqual({
        version: "16.0.0",
        isComplete: false,
        fileTypes: {
          ".txt": 1,
        },
        counts: {
          expected: 3,
          present: 1,
          missing: 2,
          orphaned: 0,
        },
        files: {
          present: ["UnicodeData.txt"],
          orphaned: [],
          missing: [
            "ReadMe.txt",
            "ArabicShaping.txt",
          ],
        },
      } satisfies AnalysisReport);
    });
  });

  describe("orphaned files", () => {
    it("should detect orphaned files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
            ],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/OrphanedFile.txt": "orphaned",
          "/test/16.0.0/AnotherOrphan.html": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16).toEqual({
        version: "16.0.0",
        isComplete: false,
        fileTypes: {
          ".txt": 2,
          ".html": 1,
        },
        files: {
          present: ["UnicodeData.txt"],
          orphaned: ["OrphanedFile.txt", "AnotherOrphan.html"],
          missing: [],
        },
        counts: {
          expected: 1,
          present: 1,
          missing: 0,
          orphaned: 2,
        },
      } satisfies AnalysisReport);
    });
  });

  describe("mixed scenarios", () => {
    it("should detect both missing and orphaned files", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
              "ReadMe.txt",
            ],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/OrphanedFile.txt": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16).toEqual({
        version: "16.0.0",
        isComplete: false,
        fileTypes: {
          ".txt": 2,
        },
        files: {
          present: ["UnicodeData.txt"],
          orphaned: ["OrphanedFile.txt"],
          missing: ["ReadMe.txt"],
        },
        counts: {
          expected: 2,
          present: 1,
          missing: 1,
          orphaned: 1,
        },
      } satisfies AnalysisReport);
    });
  });

  describe("multiple versions", () => {
    it("should analyze multiple versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": ({ params }) => {
            return HttpResponse.json({
              expectedFiles: params.version === "16.0.0" ? ["UnicodeData.txt"] : ["ReadMe.txt"],
            });
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/15.1.0/ReadMe.txt": "readme",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(2);

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16).toEqual(expect.objectContaining({
        version: "16.0.0",
        isComplete: true,
        counts: expect.objectContaining({
          expected: 1,
          present: 1,
        }),
      }));

      const v15_1 = data?.get("15.1.0");
      expect(v15_1).toBeDefined();
      expect(v15_1).toEqual(expect.objectContaining({
        version: "15.1.0",
        isComplete: true,
        counts: expect.objectContaining({
          expected: 1,
          present: 1,
        }),
      }));
    });

    it("should analyze only specified versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: ["UnicodeData.txt"],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "15.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/15.1.0/UnicodeData.txt": "data",
          "/test/15.0.0/UnicodeData.txt": "data",
        },
      });

      const [data, error] = await analyze(context, {
        versions: ["16.0.0", "15.1.0"],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(2);

      const keys = [...data!.keys()];
      expect(keys).toEqual(["16.0.0", "15.1.0"]);
    });

    it("should skip versions not in store", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: ["UnicodeData.txt"],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await analyze(context, {
        versions: ["16.0.0", "99.0.0"],
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);

      expect(data!.has("16.0.0")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle files without extensions", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "README",
              path: "README",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/README": "readme",
          "/test/16.0.0/ORPHAN": "orphaned",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16?.fileTypes).toBeDefined();
      expect(v16?.fileTypes).toEqual({
        no_extension: 2,
      });
    });

    it("should handle empty store", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();

      expect(v16).toEqual({
        version: "16.0.0",
        isComplete: false,
        files: {
          present: [],
          orphaned: [],
          missing: ["UnicodeData.txt"],
        },
        counts: {
          expected: 1,
          present: 0,
          missing: 1,
          orphaned: 0,
        },
        fileTypes: {},
      } satisfies AnalysisReport);
    });

    it("should count different file types correctly", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              path: "file1.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "file2.txt",
              path: "file2.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "file3.html",
              path: "file3.html",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/file1.txt": "data",
          "/test/16.0.0/file2.txt": "data",
          "/test/16.0.0/file3.html": "html",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const v16 = data?.get("16.0.0");
      expect(v16).toBeDefined();
      expect(v16?.fileTypes).toEqual({
        ".txt": 2,
        ".html": 1,
      });
    });
  });

  describe("filter application", () => {
    it("should apply global filters during analysis", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              path: "file1.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "file2.html",
              path: "file2.html",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { include: ["**/*.txt"] },
        initialFiles: {
          "/test/16.0.0/file1.txt": "data",
          "/test/16.0.0/file2.html": "html",
        },
      });

      const [data, error] = await analyze(context);

      expect(error).toBeNull();
      const v16 = data?.get("16.0.0");
      expect(v16?.files.present).toContain("file1.txt");
      expect(v16?.files.present).not.toContain("file2.html");
    });

    it("should apply method-specific filters during analysis", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              path: "file1.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "file2.html",
              path: "file2.html",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/file1.txt": "data",
          "/test/16.0.0/file2.html": "html",
        },
      });

      const [data, error] = await analyze(context, {
        filters: { include: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      const v16 = data?.get("16.0.0");
      expect(v16?.files.present).toContain("file1.txt");
      expect(v16?.files.present).not.toContain("file2.html");
    });

    it("should combine global and method-specific filters", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "*": [
            {
              name: "file1.txt",
              path: "file1.txt",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "file2.html",
              path: "file2.html",
              lastModified: Date.now(),
              type: "file",
            },
            {
              name: "file3.txt",
              path: "file3.txt",
              lastModified: Date.now(),
              type: "file",
            },
          ],
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { include: ["**/*"] },
        initialFiles: {
          "/test/16.0.0/file1.txt": "data",
          "/test/16.0.0/file2.html": "html",
          "/test/16.0.0/file3.txt": "data",
        },
      });

      const [data, error] = await analyze(context, {
        filters: { exclude: ["**/file3.txt"] },
      });

      expect(error).toBeNull();
      const v16 = data?.get("16.0.0");
      expect(v16?.files.present).toContain("file1.txt");
      expect(v16?.files.present).not.toContain("file3.txt");
    });
  });

  describe("error handling", () => {
    it("should handle API errors when fetching manifest", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            status: 500,
            message: "Internal Server Error",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [_data, error] = await analyze(context);

      expect(error).toBeDefined();
      expect(error?.message).toContain("Failed to fetch expected files");
    });
  });
});
