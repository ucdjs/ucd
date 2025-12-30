/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import {
  UCDStoreApiFallbackError,
  UCDStoreVersionNotFoundError,
} from "../../src/errors";
import { getFileTree } from "../../src/files/tree";

describe("getFileTree", () => {
  const SAMPLE_API_TREE = [
    { type: "file" as const, name: "UnicodeData.txt", path: "UnicodeData.txt" },
    { type: "file" as const, name: "ReadMe.txt", path: "ReadMe.txt" },
    {
      type: "directory" as const,
      name: "extracted",
      path: "extracted",
      children: [
        { type: "file" as const, name: "DerivedBidiClass.txt", path: "extracted/DerivedBidiClass.txt" },
      ],
    },
  ];

  describe("getting file tree from store", () => {
    it("should return tree structure when files exist in store", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "Unicode data content",
          "/test/16.0.0/ReadMe.txt": "Readme content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: "file", name: "UnicodeData.txt" }),
        expect.objectContaining({ type: "file", name: "ReadMe.txt" }),
      ]));
    });

    it("should return nested tree structure for subdirectories", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "derived content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);

      // Find the extracted directory
      const extractedDir = data?.find((node) => node.type === "directory" && node.name === "extracted");
      expect(extractedDir).toBeDefined();
      expect(extractedDir?.type).toBe("directory");
      if (extractedDir?.type === "directory") {
        expect(extractedDir.children).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: "file", name: "DerivedBidiClass.txt" }),
        ]));
      }
    });

    it("should return tree from the correct version directory", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.0.0"],
        initialFiles: {
          "/test/16.0.0/FileA.txt": "v16 file",
          "/test/15.0.0/FileX.txt": "v15 file",
        },
      });

      const [data16, error16] = await getFileTree(context, "16.0.0");
      expect(error16).toBeNull();
      expect(data16).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "FileA.txt" }),
      ]));
      expect(data16).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "FileX.txt" }),
      ]));

      const [data15, error15] = await getFileTree(context, "15.0.0");
      expect(error15).toBeNull();
      expect(data15).toEqual([
        expect.objectContaining({ name: "FileX.txt" }),
      ]);
    });

    it("should return empty array when directory exists but is empty", async () => {
      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Create an empty directory
      if (fs.mkdir) {
        await fs.mkdir("/test/16.0.0");
      }

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("version validation", () => {
    it("should return UCDStoreVersionNotFoundError when version is not resolved", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFileTree(context, "15.0.0");

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreVersionNotFoundError,
        fields: {
          version: "15.0.0",
        },
      });
    });

    it("should work with any version in the resolved versions list", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        initialFiles: {
          "/test/15.1.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFileTree(context, "15.1.0");

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "UnicodeData.txt" }),
      ]));
    });
  });

  describe("filter validation", () => {
    it("should exclude files matching global exclude filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          exclude: ["**/*.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/data.json": "json content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "UnicodeData.txt" }),
      ]));
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "data.json" }),
      ]));
    });

    it("should only include files matching global include filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["ReadMe.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/ReadMe.txt": "readme content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data).toEqual([
        expect.objectContaining({ name: "ReadMe.txt" }),
      ]);
    });

    it("should respect method-specific exclude filters in options", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/ReadMe.txt": "readme",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        filters: {
          exclude: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "UnicodeData.txt" }),
      ]));
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "ReadMe.txt" }),
      ]));
    });

    it("should apply combined global and method filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["**/*.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/ReadMe.txt": "readme",
          "/test/16.0.0/data.json": "json",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        filters: {
          exclude: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data).toEqual([
        expect.objectContaining({ name: "ReadMe.txt" }),
      ]);
    });

    it("should filter nested directories and their contents", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          exclude: ["extracted/**"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/extracted/DerivedAge.txt": "age",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "bidi",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([
        expect.objectContaining({ name: "UnicodeData.txt" }),
      ]);
      // Should not contain extracted directory at all
      expect(data?.find((n) => n.name === "extracted")).toBeUndefined();
    });
  });

  describe("missing directory without API fallback", () => {
    it("should return empty array when directory does not exist and allowApi is false (default)", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        // No initialFiles, directory doesn't exist
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should return empty array when directory does not exist and allowApi is explicitly false", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: false,
      });

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("api fallback (allowApi: true)", () => {
    it("should fetch file tree from API when directory does not exist in store", async () => {
      let apiCalled = false;

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            apiCalled = true;
            return HttpResponse.json(SAMPLE_API_TREE);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(apiCalled).toBe(true);
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: "file", name: "UnicodeData.txt" }),
        expect.objectContaining({ type: "file", name: "ReadMe.txt" }),
        expect.objectContaining({ type: "directory", name: "extracted" }),
      ]));
    });

    it("should prefer store tree over API when directory exists in store", async () => {
      let apiCalled = false;

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            apiCalled = true;
            return HttpResponse.json(SAMPLE_API_TREE);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/16.0.0/StoreOnly.txt": "store content",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(apiCalled).toBe(false);
      expect(data).toEqual([
        expect.objectContaining({ name: "StoreOnly.txt" }),
      ]);
    });

    it("should return error when API fetch fails with error status", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            return HttpResponse.json({
              status: 404,
              message: "Version not found",
              timestamp: new Date().toISOString(),
            }, { status: 404 });
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreApiFallbackError,
        fields: {
          version: "16.0.0",
          filePath: "file-tree",
          reason: "fetch-failed",
          status: 404,
        },
      });
    });

    it("should return error when API returns null data", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            return HttpResponse.json(null);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreApiFallbackError,
        fields: {
          version: "16.0.0",
          filePath: "file-tree",
          reason: "no-data",
        },
      });
    });

    it("should apply filters to API response", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            return HttpResponse.json([
              { type: "file" as const, name: "UnicodeData.txt", path: "UnicodeData.txt" },
              { type: "file" as const, name: "ReadMe.txt", path: "ReadMe.txt" },
              { type: "file" as const, name: "data.json", path: "data.json" },
            ]);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["**/*.txt"],
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "UnicodeData.txt" }),
        expect.objectContaining({ name: "ReadMe.txt" }),
      ]));
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "data.json" }),
      ]));
    });

    it("should preserve nested tree structure from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            return HttpResponse.json([
              {
                type: "directory" as const,
                name: "level1",
                path: "level1",
                children: [
                  {
                    type: "directory" as const,
                    name: "level2",
                    path: "level1/level2",
                    children: [
                      { type: "file" as const, name: "deep.txt", path: "level1/level2/deep.txt" },
                    ],
                  },
                  { type: "file" as const, name: "mid.txt", path: "level1/mid.txt" },
                ],
              },
              { type: "file" as const, name: "root.txt", path: "root.txt" },
            ]);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();

      // Check root level
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: "file", name: "root.txt" }),
        expect.objectContaining({ type: "directory", name: "level1" }),
      ]));

      // Check nested structure
      const level1 = data?.find((n) => n.name === "level1");
      expect(level1?.type).toBe("directory");
      if (level1?.type === "directory") {
        expect(level1.children).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: "file", name: "mid.txt" }),
          expect.objectContaining({ type: "directory", name: "level2" }),
        ]));

        const level2 = level1.children?.find((n) => n.name === "level2");
        expect(level2?.type).toBe("directory");
        if (level2?.type === "directory") {
          expect(level2.children).toEqual([
            expect.objectContaining({ type: "file", name: "deep.txt" }),
          ]);
        }
      }
    });
  });

  describe("call signature variations", () => {
    it("should work with explicit context parameter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/16.0.0/ReadMe.txt": "Hello World",
        },
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "ReadMe.txt" }),
      ]));
    });

    it("should work with bound context using Function.bind()", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "/test/16.0.0/ReadMe.txt": "Hello Bound",
        },
      });

      const boundGetFileTree = getFileTree.bind(context);
      const [data, error] = await boundGetFileTree("16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "ReadMe.txt" }),
      ]));
    });
  });
});
