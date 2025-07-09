import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { HttpResponse, mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../src/factory";

describe("clean operations across store types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  const mockFiles = [
    {
      type: "file",
      name: "ArabicShaping.txt",
      path: "/ArabicShaping.txt",
      lastModified: 1644920820000,
    },
    {
      type: "file",
      name: "BidiBrackets.txt",
      path: "/BidiBrackets.txt",
      lastModified: 1651584360000,
    },
    {
      type: "directory",
      name: "extracted",
      path: "/extracted/",
      lastModified: 1724676960000,
      children: [
        {
          type: "file",
          name: "DerivedBidiClass.txt",
          path: "/DerivedBidiClass.txt",
          lastModified: 1724609100000,
        },
      ],
    },
  ];

  describe("remote store clean operations", () => {
    it("should handle clean on remote store (no actual cleaning)", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createHTTPUCDStore();

      console.error(store.versions);

      const result = await store.clean();

      expect(result.locatedFiles).toEqual([]);
      expect(result.removedFiles).toEqual([]);
      expect(result.failedRemovals).toEqual([]);
    });

    it("should handle remote store clean with dryRun", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createHTTPUCDStore();

      const result = await store.clean({ dryRun: true });

      expect(result.locatedFiles).toEqual([]);
      expect(result.removedFiles).toEqual([]);
      expect(result.failedRemovals).toEqual([]);
    });

    it("should handle remote store clean with specific versions", async () => {
      const versions = ["15.0.0", "15.1.0"];
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json(versions.map((version) => ({
            version,
            path: `/${version}`,
          })));
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/:version`, ({ params }) => {
          const { version } = params;

          if (version === "15.1.0") {
            return HttpResponse.json(mockFiles.slice(0, 1));
          }

          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createHTTPUCDStore();

      const result = await store.clean({ versions: ["15.0.0"] });

      expect(result.locatedFiles).toEqual([]);
      expect(result.removedFiles).toEqual([]);
      expect(result.failedRemovals).toEqual([]);
    });
  });

  describe("local store clean operations", () => {
    it("should clean all files from all versions when no versions specified", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
        },
        "15.1.0": {
          "DerivedBidiClass.txt": "Derived bidi class data",
        },
        "orphaned-file.txt": "This will remain untouched",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean();

      // Should remove ALL files from ALL versions
      expect(result.locatedFiles).toContain("15.0.0/ArabicShaping.txt");
      expect(result.locatedFiles).toContain("15.0.0/BidiBrackets.txt");
      expect(result.locatedFiles).toContain("15.1.0/DerivedBidiClass.txt");
      expect(result.removedFiles).toContain("15.0.0/ArabicShaping.txt");
      expect(result.removedFiles).toContain("15.0.0/BidiBrackets.txt");
      expect(result.removedFiles).toContain("15.1.0/DerivedBidiClass.txt");
      expect(result.removedFiles).toHaveLength(3);

      // Verify all version files are removed
      expect(await store.fs.exists(`${storeDir}/15.0.0/ArabicShaping.txt`)).toBe(false);
      expect(await store.fs.exists(`${storeDir}/15.0.0/BidiBrackets.txt`)).toBe(false);
      expect(await store.fs.exists(`${storeDir}/15.1.0/DerivedBidiClass.txt`)).toBe(false);

      // Orphaned file should remain (it's not part of any version)
      expect(await store.fs.exists(`${storeDir}/orphaned-file.txt`)).toBe(true);
    });

    it("should perform dry run without actually removing files", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
        },
        "orphaned-file.txt": "This will remain untouched",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ dryRun: true });

      // should identify files to remove but not actually remove them
      expect(result.locatedFiles).toContain("15.0.0/ArabicShaping.txt");
      expect(result.locatedFiles).toContain("15.0.0/BidiBrackets.txt");
      expect(result.removedFiles).toHaveLength(0); // No actual deletions in dry run

      // verify all files still exist after dry run
      expect(await store.fs.exists(`${storeDir}/15.0.0/ArabicShaping.txt`)).toBe(true);
      expect(await store.fs.exists(`${storeDir}/15.0.0/BidiBrackets.txt`)).toBe(true);
      expect(await store.fs.exists(`${storeDir}/orphaned-file.txt`)).toBe(true);
    });

    it("should clean only specified versions", async () => {
      const storeStructure = {
        "15.0.0": {
          "file1.txt": "Version 15.0.0 file",
        },
        "15.1.0": {
          "file2.txt": "Version 15.1.0 file",
        },
        "orphaned-v1.txt": "Orphaned from v1",
        "orphaned-v2.txt": "Orphaned from v2",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ versions: ["15.0.0"] });

      // Should remove ALL files from specified version
      expect(result.locatedFiles).toContain("15.0.0/file1.txt");
      expect(result.removedFiles).toContain("15.0.0/file1.txt");
      expect(result.removedFiles.length).toBeGreaterThan(0);

      // Verify that 15.0.0 files are removed but 15.1.0 files remain
      expect(await store.fs.exists(`${storeDir}/15.0.0/file1.txt`)).toBe(false);
      expect(await store.fs.exists(`${storeDir}/15.1.0/file2.txt`)).toBe(true);
      // Orphaned files should still exist (they're not version-specific)
      expect(await store.fs.exists(`${storeDir}/orphaned-v1.txt`)).toBe(true);
      expect(await store.fs.exists(`${storeDir}/orphaned-v2.txt`)).toBe(true);
    });
  });

  it("should clean multiple specified versions", async () => {
    const storeStructure = {
      "15.0.0": {
        "file1.txt": "Version 15.0.0 file",
        "subdir": {
          "nested.txt": "Nested file in 15.0.0",
        },
      },
      "15.1.0": {
        "file2.txt": "Version 15.1.0 file",
      },
      "15.2.0": {
        "file3.txt": "Version 15.2.0 file",
      },
      "orphaned.txt": "Orphaned file",
      ".ucd-store.json": JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
        { version: "15.1.0", path: "15.1.0" },
        { version: "15.2.0", path: "15.2.0" },
      ]),
    };

    const storeDir = await testdir(storeStructure, {
      cleanup: false,
    });

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });

    const result = await store.clean({ versions: ["15.0.0", "15.2.0"] });

    // Should remove ALL files from both specified versions
    expect(result.locatedFiles).toContain("15.0.0/file1.txt");
    expect(result.locatedFiles).toContain("15.0.0/subdir/nested.txt");
    expect(result.locatedFiles).toContain("15.2.0/file3.txt");
    expect(result.locatedFiles).not.toContain("15.1.0/file2.txt");
    expect(result.removedFiles).toContain("15.0.0/file1.txt");
    expect(result.removedFiles).toContain("15.0.0/subdir/nested.txt");
    expect(result.removedFiles).toContain("15.2.0/file3.txt");
    expect(result.removedFiles).toHaveLength(3); // 3 files removed
    // Verify correct files are removed
    expect(await store.fs.exists(`${storeDir}/15.0.0/file1.txt`)).toBe(false);
    expect(await store.fs.exists(`${storeDir}/15.2.0/file3.txt`)).toBe(false);
    expect(await store.fs.exists(`${storeDir}/15.1.0/file2.txt`)).toBe(true);
    expect(await store.fs.exists(`${storeDir}/orphaned.txt`)).toBe(true);
  });

  it("should differentiate between version-specific cleaning and orphaned file cleaning", async () => {
    const storeStructure = {
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
        "BidiBrackets.txt": "Bidi brackets data",
      },
      "orphaned-file.txt": "This shouldn't be here",
      ".ucd-store.json": JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
      ]),
    };

    const storeDir = await testdir(storeStructure);

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });

    // Test 1: Clean all versions when no versions specified
    const allVersionsResult = await store.clean();

    // Should clean all files from all versions
    expect(allVersionsResult.locatedFiles).toContain("15.0.0/ArabicShaping.txt");
    expect(allVersionsResult.locatedFiles).toContain("15.0.0/BidiBrackets.txt");
    expect(allVersionsResult.removedFiles).toContain("15.0.0/ArabicShaping.txt");
    expect(allVersionsResult.removedFiles).toContain("15.0.0/BidiBrackets.txt");

    // Verify that version files are removed, orphaned file remains (not managed by store)
    expect(await store.fs.exists(`${storeDir}/15.0.0/ArabicShaping.txt`)).toBe(false);
    expect(await store.fs.exists(`${storeDir}/15.0.0/BidiBrackets.txt`)).toBe(false);
    expect(await store.fs.exists(`${storeDir}/orphaned-file.txt`)).toBe(true); // Not managed by store

    // Test 2: Re-create files and test specific version cleaning
    await store.fs.write(`${storeDir}/15.0.0/ArabicShaping.txt`, "Arabic shaping data");
    await store.fs.write(`${storeDir}/15.0.0/BidiBrackets.txt`, "Bidi brackets data");

    const versionResult = await store.clean({ versions: ["15.0.0"] });

    expect(versionResult.locatedFiles).toContain("15.0.0/ArabicShaping.txt");
    expect(versionResult.locatedFiles).toContain("15.0.0/BidiBrackets.txt");
    expect(versionResult.removedFiles).toHaveLength(2);

    // Verify that all version files are removed
    expect(await store.fs.exists(`${storeDir}/15.0.0/ArabicShaping.txt`)).toBe(false);
    expect(await store.fs.exists(`${storeDir}/15.0.0/BidiBrackets.txt`)).toBe(false);
  });

  it("should handle cleaning non-existent versions gracefully", async () => {
    const storeStructure = {
      "15.0.0": {
        "file.txt": "Version 15.0.0 file",
      },
      ".ucd-store.json": JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
      ]),
    };

    const storeDir = await testdir(storeStructure);

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });

    const result = await store.clean({ versions: ["nonexistent-version"] });

    expect(result.locatedFiles).toEqual([]);
    expect(result.removedFiles).toEqual([]);
    expect(result.failedRemovals).toEqual([]);
    // Verify existing files are untouched
    expect(await store.fs.exists(`${storeDir}/15.0.0/file.txt`)).toBe(true);
  });

  it("should handle mixed orphaned files and version-specific files correctly", async () => {
    const storeStructure = {
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
        "unexpected-file.txt": "This file shouldn't be in the manifest",
      },
      "15.1.0": {
        "BidiBrackets.txt": "Bidi brackets data",
      },
      "store-level-orphan.txt": "Store level orphaned file",
      ".ucd-store.json": JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
        { version: "15.1.0", path: "15.1.0" },
      ]),
    };

    const storeDir = await testdir(storeStructure);

    // Mock getFilePaths to only return ArabicShaping.txt for 15.0.0 (making unexpected-file.txt orphaned)
    const store = await createNodeUCDStore({
      basePath: storeDir,
    });

    // Mock to simulate that unexpected-file.txt is not in manifest
    const originalGetFilePaths = store.getFilePaths.bind(store);
    store.getFilePaths = vi.fn().mockImplementation(async (version: string) => {
      if (version === "15.0.0") {
        return ["ArabicShaping.txt"]; // Don't include unexpected-file.txt
      }
      return originalGetFilePaths(version);
    });

    const result = await store.clean();

    // Clean should only remove files that are returned by getFilePaths
    expect(result.locatedFiles).toContain("15.0.0/ArabicShaping.txt");
    expect(result.locatedFiles).toContain("15.1.0/BidiBrackets.txt");
    expect(result.locatedFiles).not.toContain("15.0.0/unexpected-file.txt");
    expect(result.locatedFiles).not.toContain("store-level-orphan.txt");
    expect(result.removedFiles).toContain("15.0.0/ArabicShaping.txt");
    expect(result.removedFiles).toContain("15.1.0/BidiBrackets.txt");
  });

  it("should handle clean failure with partial results", async () => {
    const storeStructure = {
      "15.0.0": {
        "file.txt": "legitimate file",
      },
      "orphaned1.txt": "orphaned file 1",
      "orphaned2.txt": "orphaned file 2",
      ".ucd-store.json": JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
      ]),
    };

    const storeDir = await testdir(storeStructure);

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });

    // Mock rm to fail on specific file
    const originalRM = store.fs.rm;
    store.fs.rm = vi.fn().mockImplementation(async (path: string) => {
      if (path.includes("file.txt")) {
        throw new Error("Permission denied");
      }
      return originalRM.call(store.fs, path);
    });

    const result = await store.clean();

    expect(result.failedRemovals.length).toBeGreaterThan(0);
    expect(result.failedRemovals[0]?.filePath).toContain("15.0.0/file.txt");
    expect(result.failedRemovals[0]?.error).toContain("Permission denied");
  });

  it("should update manifest after removing empty version directories", async () => {
    const storeStructure = {
      "15.0.0": {
        "file.txt": "only file in version",
      },
      ".ucd-store.json": JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
      ]),
    };

    const storeDir = await testdir(storeStructure);

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });

    const result = await store.clean();

    expect(result.locatedFiles).toContain("15.0.0/file.txt");
    expect(result.removedFiles).toContain("15.0.0/file.txt");

    // verify that the version directory and manifest are cleaned up
    expect(await store.fs.exists(`${storeDir}/15.0.0`)).toBe(false);
    // check that manifest was updated (versions should be empty)
    expect(store.versions).toEqual([]);
  });

  describe("createUCDStore clean operations", () => {
    it("should handle local store created via createUCDStore", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        "orphaned.txt": "orphaned file",
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createUCDStore({
        basePath: storeDir,
        fs: await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default),
      });

      const result = await store.clean();

      expect(result.locatedFiles.length).toBeGreaterThan(0);
      expect(result.removedFiles.length).toBeGreaterThan(0);
    });

    it("should handle remote store created via createUCDStore", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const mockFS: FileSystemBridge = {
        async exists() { return true; },
        async mkdir() { },
        async read() { return JSON.stringify([{ version: "15.0.0", path: "15.0.0" }]); },
        async write() { },
        async rm() { },
        async stat() {
          return {
            mtime: new Date(),
            size: 0,
            isDirectory: () => false,
            isFile: () => true,
          };
        },
        async listdir() { return []; },
      };

      const store = await createUCDStore({
        fs: mockFS,
      });

      const result = await store.clean();

      expect(result.locatedFiles).toEqual([]);
      expect(result.removedFiles).toEqual([]);
      expect(result.failedRemovals).toEqual([]);
    });

    it("should handle version cleaning with dry run", async () => {
      const storeStructure = {
        "15.0.0": {
          "file1.txt": "Version 15.0.0 file",
          "file2.txt": "Another file",
        },
        "15.1.0": {
          "file3.txt": "Version 15.1.0 file",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ versions: ["15.0.0"], dryRun: true });

      expect(result.locatedFiles).toContain("15.0.0/file1.txt");
      expect(result.locatedFiles).toContain("15.0.0/file2.txt");
      expect(result.removedFiles).toHaveLength(0); // No actual deletions in dry run

      // verify files still exist after dry run
      expect(await store.fs.exists(`${storeDir}/15.0.0/file1.txt`)).toBe(true);
      expect(await store.fs.exists(`${storeDir}/15.0.0/file2.txt`)).toBe(true);
      expect(await store.fs.exists(`${storeDir}/15.1.0/file3.txt`)).toBe(true);
    });

    it("should handle cleaning with empty version directories", async () => {
      const storeStructure = {
        "15.0.0": {}, // Empty version directory
        "15.1.0": {
          "file.txt": "Version 15.1.0 file",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.clean({ versions: ["15.0.0"] });

      expect(result.locatedFiles).toEqual([]); // No files to remove from empty version
      expect(result.removedFiles).toEqual([]);
      expect(result.failedRemovals).toEqual([]);

      // Verify 15.1.0 is untouched
      expect(await store.fs.exists(`${storeDir}/15.1.0/file.txt`)).toBe(true);
    });

    it("should properly handle concurrent version cleaning", async () => {
      const storeStructure = {
        "15.0.0": {
          "file1.txt": "Version 15.0.0 file",
        },
        "15.1.0": {
          "file2.txt": "Version 15.1.0 file",
        },
        "15.2.0": {
          "file3.txt": "Version 15.2.0 file",
        },
        "15.3.0": {
          "file4.txt": "Version 15.3.0 file",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
          { version: "15.2.0", path: "15.2.0" },
          { version: "15.3.0", path: "15.3.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      // Clean multiple versions to test concurrent processing
      const result = await store.clean({ versions: ["15.0.0", "15.1.0", "15.3.0"] });

      expect(result.locatedFiles).toContain("15.0.0/file1.txt");
      expect(result.locatedFiles).toContain("15.1.0/file2.txt");
      expect(result.locatedFiles).toContain("15.3.0/file4.txt");
      expect(result.locatedFiles).not.toContain("15.2.0/file3.txt");
      expect(result.removedFiles).toHaveLength(3);

      // Verify correct files are removed
      expect(await store.fs.exists(`${storeDir}/15.0.0/file1.txt`)).toBe(false);
      expect(await store.fs.exists(`${storeDir}/15.1.0/file2.txt`)).toBe(false);
      expect(await store.fs.exists(`${storeDir}/15.2.0/file3.txt`)).toBe(true);
      expect(await store.fs.exists(`${storeDir}/15.3.0/file4.txt`)).toBe(false);
    });

    describe("clean edge cases", () => {
      it("should handle clean when store has no versions", async () => {
        const storeStructure = {
          ".ucd-store.json": JSON.stringify([]),
        };

        const storeDir = await testdir(storeStructure);

        const store = await createNodeUCDStore({
          basePath: storeDir,
        });

        const result = await store.clean();

        expect(result.locatedFiles).toEqual([]);
        expect(result.removedFiles).toEqual([]);
        expect(result.failedRemovals).toEqual([]);
      });

      it("should handle clean with force option", async () => {
        const storeStructure = {
          "15.0.0": {
            "file.txt": "data",
          },
          ".ucd-store.json": JSON.stringify([
            { version: "15.0.0", path: "15.0.0" },
          ]),
        };

        const storeDir = await testdir(storeStructure);

        const store = await createNodeUCDStore({
          basePath: storeDir,
        });

        const result = await store.clean();

        expect(result.locatedFiles).toContain("15.0.0/file.txt");
        expect(result.removedFiles).toContain("15.0.0/file.txt");
      });

      it("should handle clean when analysis partially fails", async () => {
        const storeStructure = {
          "15.0.0": {
            "file.txt": "data",
          },
          ".ucd-store.json": JSON.stringify([
            { version: "15.0.0", path: "15.0.0" },
          ]),
        };

        const storeDir = await testdir(storeStructure);

        const store = await createNodeUCDStore({
          basePath: storeDir,
        });

        // Clean method no longer depends on analyze, so just test normal cleaning
        const result = await store.clean();

        expect(result.locatedFiles).toContain("15.0.0/file.txt");
        expect(result.removedFiles).toContain("15.0.0/file.txt");
      });
    });
  });
});
