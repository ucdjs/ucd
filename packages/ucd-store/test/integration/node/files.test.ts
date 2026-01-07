import { mockStoreApi } from "#test-utils/mock-store";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../../src/factory";

describe("node integration: file operations", () => {
  describe("files.get", () => {
    it("should read file from disk", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 1,
            totalSize: 100,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {
          "UnicodeData.txt": "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;",
        },
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    });

    it("should read file from nested directory", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 1,
            totalSize: 100,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {
          auxiliary: {
            "GraphemeBreakProperty.txt": "grapheme break data",
          },
        },
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "auxiliary/GraphemeBreakProperty.txt");

      expect(error).toBeNull();
      expect(data).toBe("grapheme break data");
    });

    it("should return error for non-existent file", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 0,
            totalSize: 0,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {},
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "NonExistent.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toContain("does not exist");
    });

    it("should fetch from API when allowApi is true and file missing", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": "API fetched content",
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 0,
            totalSize: 0,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {},
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("API fetched content");
    });
  });

  describe("files.list", () => {
    it("should list files from disk", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 3,
            totalSize: 300,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {
          "UnicodeData.txt": "content",
          "Blocks.txt": "content",
          "Scripts.txt": "content",
        },
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      expect(data).toContain("UnicodeData.txt");
      expect(data).toContain("Blocks.txt");
      expect(data).toContain("Scripts.txt");
    });

    it("should list files from nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 2,
            totalSize: 200,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {
          "UnicodeData.txt": "content",
          "extracted": {
            "DerivedBidiClass.txt": "content",
          },
        },
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("UnicodeData.txt");
      expect(data).toContain("extracted/DerivedBidiClass.txt");
    });

    it("should apply global filters", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 3,
            totalSize: 300,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {
          "UnicodeData.txt": "content",
          "Blocks.txt": "content",
          "data.json": "content",
        },
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
        globalFilters: {
          include: ["*.txt"],
        },
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("UnicodeData.txt");
      expect(data).toContain("Blocks.txt");
      expect(data).not.toContain("data.json");
    });
  });

  describe("files.tree", () => {
    it("should return tree structure from disk", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const lockfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: {
          "16.0.0": {
            path: "16.0.0/snapshot.json",
            fileCount: 2,
            totalSize: 200,
          },
        },
      };

      const storePath = await testdir({
        ".ucd-store.lock": JSON.stringify(lockfile, null, 2),
        "16.0.0": {
          "UnicodeData.txt": "content",
          "extracted": {
            "DerivedBidiClass.txt": "content",
          },
        },
      });

      const store = await createNodeUCDStore({
        basePath: storePath,
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.tree("16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Find UnicodeData.txt at root level
      const unicodeDataFile = data?.find((n) => n.name === "UnicodeData.txt");
      expect(unicodeDataFile).toBeDefined();
      expect(unicodeDataFile?.type).toBe("file");

      // Find extracted directory
      const extractedDir = data?.find((n) => n.name === "extracted");
      expect(extractedDir).toBeDefined();
      expect(extractedDir?.type).toBe("directory");

      // Find nested file
      if (extractedDir?.type === "directory") {
        const nestedFile = extractedDir.children?.find((n) => n.name === "DerivedBidiClass.txt");
        expect(nestedFile).toBeDefined();
        expect(nestedFile?.type).toBe("file");
      }
    });
  });
});
