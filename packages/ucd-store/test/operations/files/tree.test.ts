import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFileTree } from "../../../src/files/tree";

describe("getFileTree", () => {
  describe("version validation", () => {
    it("should return error when version is not in resolved versions", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFileTree(context, "15.0.0");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("15.0.0");
    });

    it("should return error when resolved versions is empty", async () => {
      const { context } = await createTestContext({
        versions: [],
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
    });
  });

  describe("default behavior (reading from bridge)", () => {
    it("should return tree structure from bridge", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "UnicodeData.txt",
          type: "file",
        }),
        expect.objectContaining({
          name: "Blocks.txt",
          type: "file",
        }),
      ]));
    });

    it("should return nested tree structure for directories", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "content",
          "/test/16.0.0/auxiliary/GraphemeBreakProperty.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "UnicodeData.txt",
          type: "file",
        }),
        expect.objectContaining({
          name: "extracted",
          type: "directory",
          children: expect.arrayContaining([
            expect.objectContaining({
              name: "DerivedBidiClass.txt",
              type: "file",
            }),
          ]),
        }),
        expect.objectContaining({
          name: "auxiliary",
          type: "directory",
          children: expect.arrayContaining([
            expect.objectContaining({
              name: "GraphemeBreakProperty.txt",
              type: "file",
            }),
          ]),
        }),
      ]));
    });

    it("should return empty array when version directory does not exist", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        // No initial files - directory doesn't exist
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should return empty array when listdir fails", async () => {
      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("listdir:before", () => {
        throw new Error("Listdir failed");
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should not make API calls when reading from bridge", async () => {
      let apiCalled = false;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          apiCalled = true;
        },
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(apiCalled).toBe(false);
    });
  });

  describe("filter application", () => {
    it("should apply global include filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["*.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
          "/test/16.0.0/emoji-data.json": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      const names = data!.map((n) => n.name);
      expect(names).toContain("UnicodeData.txt");
      expect(names).toContain("Blocks.txt");
      expect(names).not.toContain("emoji-data.json");
    });

    it("should apply global exclude filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          exclude: ["**/extracted/**"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      const names = data!.map((n) => n.name);
      expect(names).toContain("UnicodeData.txt");
      expect(names).not.toContain("extracted");
    });

    it("should apply per-request filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
          "/test/16.0.0/Scripts.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        filters: {
          include: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.name).toBe("UnicodeData.txt");
    });

    it("should filter out empty directories after filtering", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["UnicodeData.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      // Should only have UnicodeData.txt, extracted dir should be filtered out
      // since its only child doesn't match the filter
      const names = data!.map((n) => n.name);
      expect(names).toContain("UnicodeData.txt");
      expect(names).not.toContain("extracted");
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("API fallback (allowApi: true)", () => {
    it("should fetch from API when local directory does not exist", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should prefer bridge over API when both available", async () => {
      let apiCalled = false;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          apiCalled = true;
        },
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(apiCalled).toBe(false);
    });

    it("should fall back to API when listdir fails", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("listdir:before", () => {
        throw new Error("Listdir failed");
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should return error when API request fails", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": () => new HttpResponse(null, { status: 500 }),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file tree");
    });

    it("should return error when API returns no data", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": () => HttpResponse.json(null),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("no data returned");
    });

    it("should apply filters to API results", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["UnicodeData.txt"],
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.name).toBe("UnicodeData.txt");
    });
  });

  describe("tree node structure", () => {
    it("should include required properties for file nodes", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);

      const fileNode = data![0];
      expect(fileNode).toHaveProperty("name", "UnicodeData.txt");
      expect(fileNode).toHaveProperty("type", "file");
      expect(fileNode).toHaveProperty("path");
    });

    it("should include children array for directory nodes", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);

      const dirNode = data?.[0];
      expect(dirNode).toBeDefined();
      expect(dirNode).toHaveProperty("name", "extracted");
      expect(dirNode).toHaveProperty("type", "directory");
      expect(dirNode).toHaveProperty("children");
      expect(dirNode?.type === "directory" && Array.isArray(dirNode.children)).toBe(true);
    });
  });

  describe("multiple versions", () => {
    it("should return tree for correct version", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "v16",
          "/test/16.0.0/NewFile.txt": "v16 only",
          "/test/15.1.0/UnicodeData.txt": "v15",
        },
      });

      const [data16, error16] = await getFileTree(context, "16.0.0");
      const [data15, error15] = await getFileTree(context, "15.1.0");

      expect(error16).toBeNull();
      expect(error15).toBeNull();

      const names16 = data16!.map((n) => n.name);
      const names15 = data15!.map((n) => n.name);

      expect(names16).toHaveLength(2);
      expect(names16).toContain("NewFile.txt");
      expect(names15).toHaveLength(1);
      expect(names15).not.toContain("NewFile.txt");
    });
  });
});
