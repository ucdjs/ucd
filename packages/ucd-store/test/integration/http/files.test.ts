import { mockStoreApi, mockStoreSubdomain } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { findFileByPath } from "@ucdjs-internal/shared";
import { describe, expect, it } from "vitest";
import { createHTTPUCDStore } from "../../../src/factory";

describe("http integration: file operations", () => {
  describe("files.get", () => {
    it("should fetch file from HTTP endpoint", async () => {
      const files = {
        "16.0.0": [
          {
            name: "UnicodeData.txt",
            type: "file" as const,
            lastModified: Date.now(),
            _content: "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;",
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
        },
      });

      mockStoreSubdomain({ files });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    });

    it("should fetch nested file from HTTP endpoint", async () => {
      const files = {
        "16.0.0": [
          {
            name: "auxiliary",
            type: "directory" as const,
            lastModified: Date.now(),
            children: [
              {
                name: "GraphemeBreakProperty.txt",
                type: "file" as const,
                lastModified: Date.now(),
                _content: "grapheme break data",
              },
            ],
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
        },
      });

      mockStoreSubdomain({ files });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.get("16.0.0", "auxiliary/GraphemeBreakProperty.txt");

      expect(error).toBeNull();
      expect(data).toBe("grapheme break data");
    });

    it("should return error for non-existent file", async () => {
      const files = {
        "16.0.0": [
          {
            name: "UnicodeData.txt",
            type: "file" as const,
            lastModified: Date.now(),
            _content: "some content",
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
        },
      });

      // The store subdomain will return 404 for non-existent files automatically
      mockStoreSubdomain({ files });

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

      const files = {
        "16.0.0": [
          {
            name: "Unicode.txt",
            type: "file" as const,
            lastModified: Date.now(),
            _content: unicodeContent,
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
        },
      });

      mockStoreSubdomain({ files });

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
      const files = {
        "16.0.0": [
          { type: "file" as const, name: "UnicodeData.txt", lastModified: 0 },
          { type: "file" as const, name: "Blocks.txt", lastModified: 0 },
          { type: "file" as const, name: "Scripts.txt", lastModified: 0 },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      mockStoreSubdomain({ files });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      // Paths now use the store subdomain format (no /ucd/ prefix)
      expect(data).toEqual([
        "/16.0.0/UnicodeData.txt",
        "/16.0.0/Blocks.txt",
        "/16.0.0/Scripts.txt",
      ]);
    });

    it("should list files from nested directories", async () => {
      const files = {
        "16.0.0": [
          {
            type: "file" as const,
            name: "UnicodeData.txt",
            lastModified: 0,
          },
          {
            type: "directory" as const,
            name: "extracted",
            lastModified: 0,
            children: [
              {
                type: "file" as const,
                name: "DerivedBidiClass.txt",
                lastModified: 0,
              },
            ],
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      mockStoreSubdomain({ files });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      // Paths now use the store subdomain format (no /ucd/ prefix)
      expect(data).toEqual([
        "/16.0.0/UnicodeData.txt",
        "/16.0.0/extracted/DerivedBidiClass.txt",
      ]);
    });

    it("should apply global filters", async () => {
      const files = {
        "16.0.0": [
          { type: "file" as const, name: "UnicodeData.txt", lastModified: 0 },
          { type: "file" as const, name: "Blocks.txt", lastModified: 0 },
          { type: "file" as const, name: "data.json", lastModified: 0 },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      mockStoreSubdomain({ files });

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
      // Paths now use the store subdomain format (no /ucd/ prefix)
      expect(data).toEqual([
        "/16.0.0/UnicodeData.txt",
        "/16.0.0/Blocks.txt",
      ]);
      expect(data).not.toContain("/16.0.0/data.json");
    });
  });

  describe("files.tree", () => {
    it("should return tree structure from HTTP endpoint", async () => {
      const files = {
        "16.0.0": [
          { type: "file" as const, name: "UnicodeData.txt", lastModified: 0 },
          {
            type: "directory" as const,
            name: "extracted",
            lastModified: 0,
            children: [
              {
                type: "file" as const,
                name: "DerivedBidiClass.txt",
                lastModified: 0,
              },
            ],
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      mockStoreSubdomain({ files });

      const store = await createHTTPUCDStore({
        requireExistingStore: true,
        verify: false,
      });

      const [data, error] = await store.files.tree("16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Paths now use the store subdomain format (no /ucd/ prefix)
      const unicodeDataFile = findFileByPath(data || [], "/16.0.0/UnicodeData.txt");
      expect(unicodeDataFile).toBeDefined();
      expect(unicodeDataFile?.type).toBe("file");

      const extractedDir = findFileByPath(data || [], "/16.0.0/extracted");
      expect(extractedDir).toBeDefined();
      expect(extractedDir?.type).toBe("directory");

      const nestedFile = findFileByPath(data || [], "/16.0.0/extracted/DerivedBidiClass.txt");
      expect(nestedFile).toBeDefined();
      expect(nestedFile?.type).toBe("file");
    });

    it("should return empty array for empty version", async () => {
      const files = {
        "16.0.0": [],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      mockStoreSubdomain({ files });

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
      const files = {
        "16.0.0": [
          {
            name: "UnicodeData.txt",
            type: "file" as const,
            lastModified: Date.now(),
            _content: "content",
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
        },
      });

      // For error handling test, we use a custom response handler
      mockStoreSubdomain({
        files: {
          // Return empty to trigger the custom handler below
        },
      });

      // Override with custom handler that returns 500
      const { mockFetch } = await import("#test-utils/msw");
      mockFetch([
        [["GET", "HEAD"], "https://ucd-store.ucdjs.dev/:wildcard*", () => {
          return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
        }],
      ]);

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
      const files = {
        "16.0.0": [
          {
            name: "UnicodeData.txt",
            type: "file" as const,
            lastModified: Date.now(),
            _content: "v16 content",
          },
        ],
        "15.0.0": [
          {
            name: "UnicodeData.txt",
            type: "file" as const,
            lastModified: Date.now(),
            _content: "v15 content",
          },
        ],
      };

      mockStoreApi({
        versions: ["16.0.0", "15.0.0"],
        files,
        responses: {
          "/.well-known/ucd-config.json": true,
          "/api/v1/versions": true,
        },
      });

      mockStoreSubdomain({ files });

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
