/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import {
  UCDStoreApiFallbackError,
  UCDStoreVersionNotFoundError,
} from "../../src/errors";
import { listFiles } from "../../src/files/list";

describe("listFiles", () => {
  describe("listing files from store", () => {
    it("should return flat array of file paths when files exist in store", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "Unicode data content",
          "16.0.0/ReadMe.txt": "Readme content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        "/16.0.0/UnicodeData.txt",
        "/16.0.0/ReadMe.txt",
      ]));
    });

    it("should include files from nested subdirectories", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/extracted/DerivedBidiClass.txt": "derived content",
          "16.0.0/extracted/DerivedAge.txt": "age content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        "/16.0.0/UnicodeData.txt",
        "/16.0.0/extracted/DerivedBidiClass.txt",
        "/16.0.0/extracted/DerivedAge.txt",
      ]));
    });

    it("should list files from the correct version directory", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.0.0"],
        initialFiles: {
          "16.0.0/FileA.txt": "v16 file",
          "16.0.0/FileB.txt": "v16 file B",
          "15.0.0/FileX.txt": "v15 file",
        },
      });

      const [data16, error16] = await listFiles(context, "16.0.0");
      expect(error16).toBeNull();
      expect(data16).toEqual(expect.arrayContaining([
        "/16.0.0/FileA.txt",
        "/16.0.0/FileB.txt",
      ]));
      expect(data16).not.toContain("/15.0.0/FileX.txt");

      const [data15, error15] = await listFiles(context, "15.0.0");
      expect(error15).toBeNull();
      expect(data15).toEqual(["/15.0.0/FileX.txt"]);
    });

    it("should return empty array when directory exists but is empty", async () => {
      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Create an empty directory marker
      await fs.mkdir!("16.0.0");

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("version validation", () => {
    it("should return UCDStoreVersionNotFoundError when version is not resolved", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await listFiles(context, "15.0.0");

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
          "15.1.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await listFiles(context, "15.1.0");

      expect(error).toBeNull();
      expect(data).toContain("/15.1.0/UnicodeData.txt");
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
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/data.json": "json content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).not.toContain("/16.0.0/UnicodeData.txt");
      expect(data).toContain("/16.0.0/data.json");
    });

    it("should only include files matching global include filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["ReadMe.txt"],
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/ReadMe.txt": "readme content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(["/16.0.0/ReadMe.txt"]);
    });

    it("should respect method-specific exclude filters in options", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/ReadMe.txt": "readme",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: {
          exclude: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).not.toContain("/16.0.0/UnicodeData.txt");
      expect(data).toContain("/16.0.0/ReadMe.txt");
    });

    it("should apply combined global and method filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["**/*.txt"],
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": "content",
          "16.0.0/ReadMe.txt": "readme",
          "16.0.0/data.json": "json",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: {
          exclude: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).toEqual(["/16.0.0/ReadMe.txt"]);
    });
  });

  describe("missing directory without API fallback", () => {
    it("should return empty array when directory does not exist and allowApi is false (default)", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        // No initialFiles, directory doesn't exist
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should return empty array when directory does not exist and allowApi is explicitly false", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await listFiles(context, "16.0.0", {
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
        versions: ["17.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
          "/.well-known/ucd-config.json": true,
          "/.well-known/ucd-store/{version}.json": true,
        },
        onRequest: ({ path }) => {
          if (path === "/api/v1/versions/17.0.0/file-tree") {
            apiCalled = true;
          }
        },
      });

      const { context } = await createTestContext({
        versions: ["17.0.0"],
      });

      const [data, error] = await listFiles(context, "17.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(apiCalled).toBe(true);
      expect(data).toEqual(expect.arrayContaining([
        "/17.0.0/ucd/ArabicShaping.txt",
        "/17.0.0/ucd/BidiBrackets.txt",
        "/17.0.0/ucd/extracted/DerivedBidiClass.txt",
      ]));
    });

    it("should prefer store files over API when directory exists in store", async () => {
      let apiCalled = false;

      mockStoreApi({
        versions: ["17.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
          "/.well-known/ucd-config.json": true,
          "/.well-known/ucd-store/{version}.json": true,
        },
        onRequest: ({ path }) => {
          if (path === "/api/v1/versions/17.0.0/file-tree") {
            apiCalled = true;
          }
        },
      });

      const { context } = await createTestContext({
        versions: ["17.0.0"],
        initialFiles: {
          "17.0.0/StoreOnly.txt": "store content",
        },
      });

      const [data, error] = await listFiles(context, "17.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(apiCalled).toBe(false);
      expect(data).toEqual(["/17.0.0/StoreOnly.txt"]);
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

      const [data, error] = await listFiles(context, "16.0.0", {
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

      const [data, error] = await listFiles(context, "16.0.0", {
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
              { type: "file", name: "UnicodeData.txt", path: "/16.0.0/UnicodeData.txt", lastModified: null },
              { type: "file", name: "ReadMe.txt", path: "/16.0.0/ReadMe.txt", lastModified: null },
              { type: "file", name: "data.json", path: "/16.0.0/data.json", lastModified: null },
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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining(["/16.0.0/UnicodeData.txt", "/16.0.0/ReadMe.txt"]));
      expect(data).not.toContain("/16.0.0/data.json");
    });

    it("should handle deeply nested file trees from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            return HttpResponse.json([
              {
                type: "directory",
                name: "level1",
                path: "/16.0.0/ucd/level1/",
                lastModified: null,
                children: [
                  {
                    type: "directory",
                    name: "level2",
                    path: "/16.0.0/ucd/level1/level2/",
                    lastModified: null,
                    children: [
                      {
                        type: "file",
                        name: "deep.txt",
                        path: "/16.0.0/ucd/level1/level2/deep.txt",
                        lastModified: null,
                      },
                    ],
                  },
                  { type: "file", name: "mid.txt", path: "/16.0.0/ucd/level1/mid.txt", lastModified: null },
                ],
              },
              { type: "file", name: "root.txt", path: "/16.0.0/ucd/root.txt", lastModified: null },
            ]);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toEqual(expect.arrayContaining([
        "/16.0.0/ucd/level1/level2/deep.txt",
        "/16.0.0/ucd/level1/mid.txt",
        "/16.0.0/ucd/root.txt",
      ]));
    });
  });

  describe("call signature variations", () => {
    it("should work with explicit context parameter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/ReadMe.txt": "Hello World",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("/16.0.0/ReadMe.txt");
    });

    it("should work with bound context using Function.bind()", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/ReadMe.txt": "Hello Bound",
        },
      });

      const boundListFiles = listFiles.bind(context);
      const [data, error] = await boundListFiles("16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("/16.0.0/ReadMe.txt");
    });
  });
});
