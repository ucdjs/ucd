import type { AnalysisReport } from "../../src/operations/analyze";
import { createEmptyLockfile } from "#internal-pkg:test-utils/lockfile-builder";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import { analyze } from "../../src/operations/analyze";

describe("analyze", () => {
  describe("complete versions", () => {
    it("should analyze complete version with all files present", async () => {
      // Arrange
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
          "/test/v16.0.0/UnicodeData.txt": "data",
          "/test/v16.0.0/ReadMe.txt": "readme",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "UnicodeData.txt",
              "ReadMe.txt",
              "ArabicShaping.txt",
            ],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/UnicodeData.txt": "data",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
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
          "/test/v16.0.0/UnicodeData.txt": "data",
          "/test/v16.0.0/OrphanedFile.txt": "orphaned",
          "/test/v16.0.0/AnotherOrphan.html": "orphaned",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
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
          "/test/v16.0.0/UnicodeData.txt": "data",
          "/test/v16.0.0/OrphanedFile.txt": "orphaned",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
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
          "/test/v16.0.0/UnicodeData.txt": "data",
          "/test/v15.1.0/ReadMe.txt": "readme",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
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
          "/test/v16.0.0/UnicodeData.txt": "data",
          "/test/v15.1.0/UnicodeData.txt": "data",
          "/test/v15.0.0/UnicodeData.txt": "data",
        },
      });

      // Act
      const [data, error] = await analyze(context, {
        versions: ["16.0.0", "15.1.0"],
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(2);

      const keys = [...data!.keys()];
      expect(keys).toEqual(["16.0.0", "15.1.0"]);
    });

    it("should skip versions not in store", async () => {
      // Arrange
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

      // Act
      const [data, error] = await analyze(context, {
        versions: ["16.0.0", "99.0.0"],
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);

      expect(data!.has("16.0.0")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle files without extensions", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: ["README"],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/README": "readme",
          "/test/v16.0.0/ORPHAN": "orphaned",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
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

      // Act
      const [data, error] = await analyze(context);

      // Assert
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
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "file1.txt",
              "file2.txt",
              "file3.html",
            ],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/file1.txt": "data",
          "/test/v16.0.0/file2.txt": "data",
          "/test/v16.0.0/file3.html": "html",
        },
      });

      // Act
      const [data, error] = await analyze(context);

      // Assert
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

  describe("error handling", () => {
    it("should handle API errors when fetching manifest", async () => {
      // Arrange
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

      // Act
      const [_data, error] = await analyze(context);

      // Assert
      expect(error).toBeDefined();
      expect(error?.message).toContain("Failed to fetch expected files");
    });
  });
});
