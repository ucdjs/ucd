import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { findFileByPath } from "@ucdjs-internal/shared";
import { describe, expect, it } from "vitest";
import { createHTTPUCDStore } from "../../../src/factory";

describe("http integration: file operations", () => {
  describe("files.get", () => {
    it("should fetch file from HTTP endpoint", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              type: "file",
              lastModified: Date.now(),
              _content: "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;",
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    });

    it("should fetch nested file from HTTP endpoint", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            {
              name: "auxiliary",
              path: "auxiliary",
              type: "directory",
              lastModified: Date.now(),
              children: [
                {
                  name: "GraphemeBreakProperty.txt",
                  path: "auxiliary/GraphemeBreakProperty.txt",
                  type: "file",
                  lastModified: Date.now(),
                  _content: "grapheme break data",
                } as any,
              ],
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
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
        files: {
          "16.0.0": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              type: "file",
              lastModified: Date.now(),
              _content: "some content",
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": () => new HttpResponse(null, { status: 404 }),
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "NonExistent.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it("should handle unicode content correctly", async () => {
      const unicodeContent = "# 你好世界 🌍\n# مرحبا بالعالم\n# Привет мир";

      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            {
              name: "Unicode.txt",
              path: "Unicode.txt",
              type: "file",
              lastModified: Date.now(),
              _content: unicodeContent,
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "Unicode.txt");

      expect(error).toBeNull();
      expect(data).toBe(unicodeContent);
    });
  });

  describe("files.list", () => {
    it("should list files from HTTP file tree endpoint", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: 0 },
            { type: "file", name: "Blocks.txt", path: "Blocks.txt", lastModified: 0 },
            { type: "file", name: "Scripts.txt", path: "Scripts.txt", lastModified: 0 },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      expect(data).toEqual([
        "UnicodeData.txt",
        "Blocks.txt",
        "Scripts.txt",
      ]);
    });

    it("should list files from nested directories", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            {
              type: "file",
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              lastModified: 0,
            },
            {
              type: "directory",
              name: "extracted",
              path: "extracted",
              lastModified: 0,
              children: [
                {
                  type: "file",
                  name: "DerivedBidiClass.txt",
                  path: "extracted/DerivedBidiClass.txt",
                  lastModified: 0,
                },
              ],
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data).toEqual([
        "UnicodeData.txt",
        "extracted/DerivedBidiClass.txt",
      ]);
    });

    it("should apply global filters", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: 0 },
            { type: "file", name: "Blocks.txt", path: "Blocks.txt", lastModified: 0 },
            { type: "file", name: "data.json", path: "data.json", lastModified: 0 },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
        globalFilters: {
          include: ["*.txt"],
        },
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data).toEqual([
        "UnicodeData.txt",
        "Blocks.txt",
      ]);
      expect(data).not.toContain("data.json");
    });
  });

  describe("files.tree", () => {
    it("should return tree structure from HTTP endpoint", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: 0 },
            {
              type: "directory",
              name: "extracted",
              path: "extracted",
              lastModified: 0,
              children: [
                {
                  type: "file",
                  name: "DerivedBidiClass.txt",
                  path: "extracted/DerivedBidiClass.txt",
                  lastModified: 0,
                },
              ],
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.tree("16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const unicodeDataFile = findFileByPath(data || [], "UnicodeData.txt");
      expect(unicodeDataFile).toBeDefined();
      expect(unicodeDataFile?.type).toBe("file");

      const extractedDir = findFileByPath(data || [], "extracted");
      expect(extractedDir).toBeDefined();
      expect(extractedDir?.type).toBe("directory");

      const nestedFile = findFileByPath(data || [], "extracted/DerivedBidiClass.txt");
      expect(nestedFile).toBeDefined();
      expect(nestedFile?.type).toBe("file");
    });

    it("should return empty array for empty version", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.tree("16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("http error handling", () => {
    it("should handle 500 server errors", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        files: {
          "16.0.0": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              type: "file",
              lastModified: Date.now(),
              _content: "content",
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": () => {
            return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
          },
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("version isolation", () => {
    it("should isolate files between versions", async () => {
      mockStoreApi({
        versions: ["16.0.0", "15.0.0"],
        files: {
          "16.0.0": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              type: "file",
              lastModified: Date.now(),
              _content: "v16 content",
            },
          ],
          "15.0.0": [
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              type: "file",
              lastModified: Date.now(),
              _content: "v15 content",
            },
          ],
        },
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": true,
        },
      });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data16, error16] = await store.files.get("16.0.0", "UnicodeData.txt");
      expect(error16).toBeNull();
      expect(data16).toBe("v16 content");

      const [data15, error15] = await store.files.get("15.0.0", "UnicodeData.txt");
      expect(error15).toBeNull();
      expect(data15).toBe("v15 content");
    });
  });
});
