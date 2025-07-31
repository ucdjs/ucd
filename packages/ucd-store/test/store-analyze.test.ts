import { HttpResponse, mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../src/factory";
import { createMemoryMockFS } from "./__shared";

describe("analyze operations", () => {
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
          path: "/extracted/DerivedBidiClass.txt",
          lastModified: 1724609100000,
        },
      ],
    },
  ];

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
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.version).toBe("15.0.0");
      expect(result.versions[0]?.isComplete).toBe(true);
      expect(result.versions[0]?.fileCount).toBe(3);
      expect(result.versions[0]?.orphanedFiles).toEqual([]);
      expect(result.versions[0]?.missingFiles).toEqual([]);
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
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({ checkOrphaned: true });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.version).toBe("15.0.0");
      expect(result.versions[0]?.isComplete).toBe(false);
      expect(result.versions[0]?.fileCount).toBe(4);
      expect(result.versions[0]?.orphanedFiles).toContain("OrphanedFile.txt");
      expect(result.versions[0]?.missingFiles).toEqual([]);
    });

    it("should analyze multiple versions", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data v15.0.0",
        },
        "15.1.0": {
          "BidiBrackets.txt": "Bidi brackets data v15.1.0",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/:version`, ({ params }) => {
          const { version } = params;
          if (version === "15.0.0") {
            return HttpResponse.json([mockFiles[0]]);
          }
          if (version === "15.1.0") {
            return HttpResponse.json([mockFiles[1]]);
          }
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toHaveLength(2);

      const v15_0_0 = result.versions.find((v) => v.version === "15.0.0");
      const v15_1_0 = result.versions.find((v) => v.version === "15.1.0");

      expect(v15_0_0?.isComplete).toBe(true);
      expect(v15_0_0?.fileCount).toBe(1);
      expect(v15_1_0?.isComplete).toBe(true);
      expect(v15_1_0?.fileCount).toBe(1);
    });

    it("should analyze specific versions only", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        "15.1.0": {
          "BidiBrackets.txt": "Bidi brackets data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
          { version: "15.1.0", path: "15.1.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json([mockFiles[0]]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({
        versions: ["15.0.0"],
        checkOrphaned: false,
      });

      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.version).toBe("15.0.0");
    });

    it("should handle version not found error", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({
        versions: ["99.99.99"],
        checkOrphaned: false,
      });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toEqual([]);
    });

    it("should handle API errors gracefully", async () => {
      const storeStructure = {
        "15.0.0": {
          "ArabicShaping.txt": "Arabic shaping data",
        },
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return new Response(null, { status: 500 });
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toEqual([]);
    });
  });

  describe("remote store analyze operations", () => {
    it("should analyze remote store with complete files", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json(mockFiles);
        }],
      ]);

      const store = await createHTTPUCDStore();

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.version).toBe("15.0.0");
      expect(result.versions[0]?.isComplete).toBe(true);
      expect(result.versions[0]?.fileCount).toBe(3);
    });

    it("should handle remote store with no versions", async () => {
      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createHTTPUCDStore();

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toEqual([]);
      expect(result.totalFiles).toBe(0);
    });
  });

  describe("custom store analyze operations", () => {
    it("should analyze store with custom filesystem bridge", async () => {
      const customFS = createMemoryMockFS();
      await customFS.write("/.ucd-store.json", JSON.stringify([
        { version: "15.0.0", path: "15.0.0" },
      ]));
      await customFS.write("/15.0.0/ArabicShaping.txt", "Arabic shaping data");

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json([mockFiles[0]]);
        }],
      ]);

      const store = await createUCDStore({
        basePath: "/",
        fs: customFS,
      });

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.isComplete).toBe(true);
    });
  });

  describe("analyze edge cases", () => {
    it("should handle empty store", async () => {
      const storeStructure = {
        ".ucd-store.json": JSON.stringify([]),
      };

      const storeDir = await testdir(storeStructure);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toEqual([]);
      expect(result.totalFiles).toBe(0);
    });

    it("should handle store with empty version directory", async () => {
      const storeStructure = {
        "15.0.0": {},
        ".ucd-store.json": JSON.stringify([
          { version: "15.0.0", path: "15.0.0" },
        ]),
      };

      const storeDir = await testdir(storeStructure);

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      const result = await store.analyze({ checkOrphaned: false });

      expect(result.storeHealth).toBe("healthy");
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.fileCount).toBe(0);
      expect(result.versions[0]?.isComplete).toBe(true);
    });
  });
});
