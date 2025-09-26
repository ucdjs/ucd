import type { UnicodeTree } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#internal/test-utils/msw";
import { setupMockStore } from "#internal/test-utils/store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../../src/factory";
import { createMemoryMockFS, stripChildrenFromEntries } from "../__shared";

const MOCK_FILES = [
  {
    type: "file",
    name: "ArabicShaping.txt",
    path: "ArabicShaping.txt",
    lastModified: 1644920820000,
  },
  {
    type: "file",
    name: "BidiBrackets.txt",
    path: "BidiBrackets.txt",
    lastModified: 1651584360000,
  },
  {
    type: "directory",
    name: "extracted",
    path: "extracted",
    lastModified: 1724676960000,
    children: [
      {
        type: "file",
        name: "DerivedBidiClass.txt",
        path: "DerivedBidiClass.txt",
        lastModified: 1724609100000,
      },
    ],
  },
] satisfies UnicodeTree;

describe("analyze operations", () => {
  beforeEach(() => {
    setupMockStore({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
        "/api/v1/versions/:version/file-tree": ({ params }) => {
          if (params.version === "15.0.0") {
            return HttpResponse.json([MOCK_FILES[0]!]);
          }

          if (params.version === "15.1.0") {
            return HttpResponse.json([MOCK_FILES[1]!]);
          }

          return HttpResponse.json([]);
        },
        "/api/v1/files/:wildcard": true,
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("local store analyze operations", () => {
    it("should analyze local store with complete files", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
          "extracted": {
            "DerivedBidiClass.txt": "Derived bidi class data",
          },
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
          return HttpResponse.json(MOCK_FILES);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      await store.init();

      const [analyses, error] = await store.analyze({ checkOrphaned: false });

      assert(error == null, "Expected no error");
      assert(analyses != null, "Expected analyses to be non-null");
      assert(analyses[0] != null, "Expected first analysis result to be non-null");

      expect(analyses).toHaveLength(1);
      expect(analyses[0].version).toBe("15.0.0");
      expect(analyses[0].isComplete).toBe(true);
      expect(analyses[0].fileCount).toBe(3);
      expect(analyses[0].orphanedFiles).toEqual([]);
      expect(analyses[0].missingFiles).toEqual([]);
    });

    it("should analyze local store with orphaned files", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
          "BidiBrackets.txt": "Bidi brackets data",
          "extracted": {
            "DerivedBidiClass.txt": "Derived bidi class data",
          },
          "OrphanedFile.txt": "This shouldn't be here",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
          return HttpResponse.json(MOCK_FILES);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });
      await store.init();

      const [analyses, error] = await store.analyze({ checkOrphaned: true });

      assert(error == null, "Expected no error");
      assert(analyses[0] != null, "Expected first analysis result to be non-null");

      expect(analyses).toHaveLength(1);
      expect(analyses[0].version).toBe("15.0.0");
      expect(analyses[0].isComplete).toBe(false);
      expect(analyses[0].fileCount).toBe(4);
      expect(analyses[0].orphanedFiles).toEqual([
        "OrphanedFile.txt",
      ]);
      expect(analyses[0].missingFiles).toEqual([]);
    });

    it("should analyze multiple versions", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data v15.0.0",
        },
        "15.1.0": {
          "BidiBrackets.txt": "Bidi brackets data v15.1.0",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
          "15.1.0": "15.1.0",
        }),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });
      await store.init();

      const [analyses, error] = await store.analyze({ checkOrphaned: false });

      assert(error == null, "Expected no error");
      expect(analyses).toHaveLength(2);

      const v15_0_0 = analyses.find((v) => v.version === "15.0.0");
      const v15_1_0 = analyses.find((v) => v.version === "15.1.0");

      assert(v15_0_0 != null, "Expected v15.0.0 analysis to be non-null");
      assert(v15_1_0 != null, "Expected v15.1.0 analysis to be non-null");

      expect(v15_0_0.isComplete).toBe(true);
      expect(v15_0_0.fileCount).toBe(1);
      expect(v15_1_0.isComplete).toBe(true);
      expect(v15_1_0.fileCount).toBe(1);
    });

    it("should analyze specific versions only", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        "15.1.0": {
          "BidiBrackets.txt": "Bidi brackets data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
          "15.1.0": "15.1.0",
        }),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
          return HttpResponse.json([MOCK_FILES[0]]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });
      await store.init();

      const [analyses, error] = await store.analyze({
        versions: ["15.0.0"],
        checkOrphaned: false,
      });

      assert(error == null, "Expected no error");
      assert(analyses[0] != null, "Expected first analyze result to be non-null");

      expect(analyses).toHaveLength(1);
      expect(analyses[0].version).toBe("15.0.0");
    });

    it("should handle version not found error", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      await store.init();
      await store.mirror();

      const version = "99.99.99";

      const [analyses, error] = await store.analyze({
        versions: [version],
        checkOrphaned: false,
      });

      expect(analyses).toBeNull();
      assert(error != null, "Expected error to be non-null");
      expect(error).toEqual(new UCDStoreVersionNotFoundError(version));
    });

    it("should handle API errors gracefully", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify({
          "15.0.0": "15.0.0",
        }),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
          return new Response(null, { status: 500 });
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      await store.init();
      await store.mirror();

      const [analyses, error] = await store.analyze({ checkOrphaned: false });

      expect(analyses).toBeNull();
      assert(error != null, "Expected error to be non-null");
      expect(error).toBeInstanceOf(UCDStoreGenericError);
    });
  });

  describe("remote store analyze operations", () => {
    it("should analyze remote store with complete files", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/files/.ucd-store.json`, () => {
          return HttpResponse.json({
            "15.0.0": "15.0.0",
          });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
          return HttpResponse.json(MOCK_FILES);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0/:file?`, ({ params }) => {
          const file = params.file;

          if (file === "extracted") {
            return HttpResponse.json(MOCK_FILES[2]?.children);
          }

          return HttpResponse.json(stripChildrenFromEntries(MOCK_FILES));
        }],
        ["HEAD", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(stripChildrenFromEntries(MOCK_FILES));
        }],
      ]);

      const store = await createHTTPUCDStore();
      await store.init();

      const [analyses, error] = await store.analyze({ checkOrphaned: false });

      assert(error == null, "Expected no error");
      assert(analyses[0] != null, "Expected first analyze result to be non-null");

      expect(analyses).toHaveLength(1);
      expect(analyses[0].version).toBe("15.0.0");
      expect(analyses[0].isComplete).toBe(true);
      expect(analyses[0].fileCount).toBe(3);
    });

    it("should handle remote store with no versions", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/files/.ucd-store.json`, () => {
          return HttpResponse.json({});
        }],
      ]);

      const store = await createHTTPUCDStore();
      await store.init();
      await store.mirror();

      const [analyses, error] = await store.analyze({ checkOrphaned: false });

      assert(error == null, "Expected no error");
      expect(analyses).toEqual([]);

      const totalFileCount = analyses.reduce((sum, { fileCount }) => sum + fileCount, 0);
      expect(totalFileCount).toBe(0);
    });
  });

  describe("custom store analyze operations", () => {
    it("should analyze store with custom filesystem bridge", async () => {
      const customFS = createMemoryMockFS();

      assertCapability(customFS, "write");
      await customFS.write("/.ucd-store.json", JSON.stringify({
        "15.0.0": "15.0.0",
      }));
      await customFS.write("/15.0.0/ArabicShaping.txt", "Arabic shaping data");

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json([MOCK_FILES[0]]);
        }],
      ]);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
          return HttpResponse.json([MOCK_FILES[0]]);
        }],
      ]);

      const store = createUCDStore({
        basePath: "/",
        fs: customFS,
      });
      await store.init();

      const [analyses, error] = await store.analyze({ checkOrphaned: false });

      assert(error == null, "Expected no error");
      assert(analyses[0] != null, "Expected first analyze result to be non-null");

      expect(analyses).toHaveLength(1);
      expect(analyses[0].isComplete).toBe(true);
    });
  });

  it("should handle empty store", async () => {
    const storeDir = await testdir({
      ".ucd-store.json": JSON.stringify({}),
    });

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });
    await store.init();

    const [analyses, error] = await store.analyze({ checkOrphaned: false });

    assert(error == null, "Expected no error");
    expect(analyses).toEqual([]);
    expect(analyses.length).toBe(0);
  });

  it("should analyze store with no files", async () => {
    const storeDir = await testdir({
      "15.0.0": {},
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
        return HttpResponse.json([]);
      }],
    ]);

    const store = await createNodeUCDStore({
      basePath: storeDir,
    });
    await store.init();

    const [analyses, error] = await store.analyze({ checkOrphaned: false });

    assert(error == null, "Expected no error");
    assert(analyses[0] != null, "Expected first analyze result to be non-null");

    expect(analyses).toHaveLength(1);
    expect(analyses[0].version).toBe("15.0.0");
    expect(analyses[0].fileCount).toBe(0);
    expect(analyses[0].isComplete).toBe(true);
  });

  it("should analyze store with missing files", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
        "BidiBrackets.txt": "Bidi brackets data",
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
        return HttpResponse.json([
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "DerivedBidiClass.txt",
            path: "DerivedBidiClass.txt",
            lastModified: 1644920820000,
          },
        ]);
      }],
    ]);

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();

    const [analyses, error] = await store.analyze({ checkOrphaned: true });

    assert(error == null, "Expected no error");
    assert(analyses[0] != null, "Expected first analyze result to be non-null");

    const analysisResult = analyses[0];

    expect(analysisResult.version).toBe("15.0.0");
    expect(analysisResult.isComplete).toBe(false);

    expect(analysisResult.fileCount).toBeLessThan(analysisResult.expectedFileCount);
    expect(analysisResult.fileCount).toBe(2); // only 2 files present in the store
    expect(analysisResult.expectedFileCount).toBe(3);

    expect(analysisResult.missingFiles).toEqual(["DerivedBidiClass.txt"]);
    expect(analysisResult.orphanedFiles).toEqual([]);
    expect(analysisResult.files).toEqual([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
    ]);
  });

  it("should analyze store with both missing and orphaned files", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
        "BidiBrackets.txt": "Bidi brackets data",
        "test.txt": "This is an orphaned file",
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/15.0.0/file-tree`, () => {
        return HttpResponse.json([
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "DerivedBidiClass.txt",
            path: "DerivedBidiClass.txt",
            lastModified: 1644920820000,
          },
        ]);
      }],
    ]);

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();

    const [analyses, error] = await store.analyze({ checkOrphaned: true });

    assert(error == null, "Expected no error");
    assert(analyses[0] != null, "Expected first analyze result to be non-null");

    const analysisResult = analyses[0];

    expect(analysisResult.version).toBe("15.0.0");
    expect(analysisResult.isComplete).toBe(false);

    expect(analysisResult.fileCount).toBe(3); // only 2 files present in the store (2 expected, 1 orphaned)
    expect(analysisResult.expectedFileCount).toBe(3);

    expect(analysisResult.missingFiles).toEqual(["DerivedBidiClass.txt"]);
    expect(analysisResult.orphanedFiles).toEqual(["test.txt"]);
    expect(analysisResult.files).toEqual([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
    ]);
  });

  it.todo("should analyze store with partially missing directory structures", async () => {
    // Test case where directory exists but some files within it are missing
    // E.g., "extracted/" directory exists but "DerivedBidiClass.txt" inside is missing
  });

  it.todo("should handle file system errors during analysis", async () => {
    // Test case where filesystem operations fail during analysis
    // E.g., permission errors, corrupted files, etc.
    // Should return empty array or handle gracefully
  });

  it.todo("should analyze empty version directory", async () => {
    // Test case where version directory exists but is completely empty
    // Different from "no files" test - this has an empty directory vs no directory
  });
});
