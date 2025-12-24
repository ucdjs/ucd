import type { UnicodeTree } from "@ucdjs/schemas";
import type { VersionComparison } from "../../src/operations/compare";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../src/errors";
import { compare } from "../../src/operations/compare";

describe("compare", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  describe("local store (default behavior)", () => {
    it("should detect added files between versions", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data15",
          "/test/16.0.0/UnicodeData.txt": "data16",
          "/test/16.0.0/NewFile.txt": "newfile",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.from).toBe("15.0.0");
      expect(data!.to).toBe("16.0.0");
      expect(data!.files.added).toContain("NewFile.txt");
      expect(data!.counts.added).toBe(1);
    });

    it("should detect removed files between versions", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data15",
          "/test/15.0.0/OldFile.txt": "oldfile",
          "/test/16.0.0/UnicodeData.txt": "data16",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.files.removed).toContain("OldFile.txt");
      expect(data!.counts.removed).toBe(1);
    });

    it("should detect modified files between versions", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "old content",
          "/test/16.0.0/UnicodeData.txt": "new content",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.files.modified).toContain("UnicodeData.txt");
      expect(data!.counts.modified).toBe(1);
    });

    it("should detect unchanged files between versions", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "same content",
          "/test/16.0.0/UnicodeData.txt": "same content",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.files.unchanged).toContain("UnicodeData.txt");
      expect(data!.counts.unchanged).toBe(1);
    });

    it("should handle complete comparison with all change types", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          // Unchanged file
          "/test/15.0.0/Common.txt": "common",
          "/test/16.0.0/Common.txt": "common",
          // Modified file
          "/test/15.0.0/Modified.txt": "old version",
          "/test/16.0.0/Modified.txt": "new version",
          // Removed file (only in from)
          "/test/15.0.0/Removed.txt": "removed",
          // Added file (only in to)
          "/test/16.0.0/Added.txt": "added",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual({
        from: "15.0.0",
        to: "16.0.0",
        files: {
          added: ["Added.txt"],
          removed: ["Removed.txt"],
          modified: ["Modified.txt"],
          unchanged: ["Common.txt"],
        },
        counts: {
          fromTotal: 3,
          toTotal: 3,
          added: 1,
          removed: 1,
          modified: 1,
          unchanged: 1,
        },
      } satisfies VersionComparison);
    });

    it("should correctly count totals for each version", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/File1.txt": "1",
          "/test/15.0.0/File2.txt": "2",
          "/test/16.0.0/File1.txt": "1",
          "/test/16.0.0/File3.txt": "3",
          "/test/16.0.0/File4.txt": "4",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.counts.fromTotal).toBe(2);
      expect(data!.counts.toTotal).toBe(3);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("API fallback (allowApi: true)", () => {
    it("should fetch from API when version is not available locally", async () => {
      let apiCallCount = 0;
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": ({ params }) => {
            apiCallCount++;
            if (params.version === "15.0.0") {
              return HttpResponse.json([
                {
                  type: "file",
                  name: "UnicodeData.txt",
                  path: "UnicodeData.txt",
                  lastModified: Date.now(),
                },
              ] satisfies UnicodeTree);
            }
            return HttpResponse.json([
              {
                type: "file",
                name: "UnicodeData.txt",
                path: "UnicodeData.txt",
                lastModified: Date.now(),
              },
              {
                type: "file",
                name: "NewFile.txt",
                path: "NewFile.txt",
                lastModified: Date.now(),
              },
            ] satisfies UnicodeTree);
          },
          "/api/v1/files/{wildcard}": ({ params }) => {
            const filePath = params.wildcard ?? "";
            if (filePath.includes("15.0.0")) {
              return HttpResponse.text("content-15");
            }
            return HttpResponse.text("content-16");
          },
        },
        onRequest: () => {},
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: [], // No local versions
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.files.added).toContain("NewFile.txt");
      expect(apiCallCount).toBeGreaterThan(0);
    });

    it("should prefer local store over API when version exists locally", async () => {
      let apiCallCount = 0;
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
        onRequest: () => {
          apiCallCount++;
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "local-15",
          "/test/16.0.0/UnicodeData.txt": "local-16",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // API should not be called for file tree since versions exist locally
      expect(apiCallCount).toBe(0);
    });
  });

  describe("validation", () => {
    it("should throw error when 'from' version is missing", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await compare(context, {
        to: "16.0.0",
      } as any);

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Both 'from' and 'to' versions must be specified/);
    });

    it("should throw error when 'to' version is missing", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await compare(context, {
        from: "15.0.0",
      } as any);

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Both 'from' and 'to' versions must be specified/);
    });

    it("should throw error when options are not provided", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await compare(context);

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Both 'from' and 'to' versions must be specified/);
    });

    it("should throw error for non-existent 'from' version when allowApi is false", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await compare(context, {
        from: "99.0.0",
        to: "16.0.0",
      });

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toMatch(/99\.0\.0/);
    });

    it("should throw error for non-existent 'to' version when allowApi is false", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await compare(context, {
        from: "15.0.0",
        to: "99.0.0",
      });

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toMatch(/99\.0\.0/);
    });
  });

  describe("filter application", () => {
    it("should apply global include filters", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({ include: ["**/*.txt"] });
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data",
          "/test/15.0.0/Data.html": "html",
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/Data.html": "html",
          "/test/16.0.0/NewFile.txt": "new",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should only include .txt files
      const allFiles = [
        ...data!.files.added,
        ...data!.files.removed,
        ...data!.files.modified,
        ...data!.files.unchanged,
      ];

      allFiles.forEach((file) => {
        expect(file).toMatch(/\.txt$/);
      });
    });

    it("should apply global exclude filters", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({ exclude: ["**/*.html"] });
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data",
          "/test/15.0.0/Data.html": "html",
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/Data.html": "html",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should not include .html files
      const allFiles = [
        ...data!.files.added,
        ...data!.files.removed,
        ...data!.files.modified,
        ...data!.files.unchanged,
      ];

      allFiles.forEach((file) => {
        expect(file).not.toMatch(/\.html$/);
      });
    });

    it("should apply method-specific filters", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data",
          "/test/15.0.0/Blocks.txt": "blocks",
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/Blocks.txt": "blocks",
          "/test/16.0.0/NewFile.txt": "new",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
        filters: {
          include: ["**/Unicode*.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should only include files matching Unicode*.txt
      const allFiles = [
        ...data!.files.added,
        ...data!.files.removed,
        ...data!.files.modified,
        ...data!.files.unchanged,
      ];

      allFiles.forEach((file) => {
        expect(file).toMatch(/^Unicode.*\.txt$/);
      });
      expect(allFiles).not.toContain("Blocks.txt");
      expect(allFiles).not.toContain("NewFile.txt");
    });
  });

  describe("edge cases", () => {
    it("should handle empty versions (no files)", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter();
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/": "",
          "/test/16.0.0/": "",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.counts.fromTotal).toBe(0);
      expect(data!.counts.toTotal).toBe(0);
      expect(data!.files.added).toHaveLength(0);
      expect(data!.files.removed).toHaveLength(0);
      expect(data!.files.modified).toHaveLength(0);
      expect(data!.files.unchanged).toHaveLength(0);
    });

    it("should handle comparing same version", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/Blocks.txt": "blocks",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "16.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // All files should be unchanged when comparing same version
      expect(data!.files.added).toHaveLength(0);
      expect(data!.files.removed).toHaveLength(0);
      expect(data!.files.modified).toHaveLength(0);
      expect(data!.files.unchanged).toHaveLength(2);
    });

    it("should handle nested directory structures", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/auxiliary/Blocks.txt": "blocks15",
          "/test/15.0.0/extracted/Data.txt": "data15",
          "/test/16.0.0/auxiliary/Blocks.txt": "blocks16-modified",
          "/test/16.0.0/extracted/Data.txt": "data16",
          "/test/16.0.0/extracted/NewData.txt": "newdata",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.files.added).toContain("extracted/NewData.txt");
      expect(data!.files.modified).toContain("auxiliary/Blocks.txt");
    });

    it("should return frozen file arrays", async () => {
      mockStoreApi({
        versions: ["15.0.0", "16.0.0"],
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.0.0/UnicodeData.txt": "data",
          "/test/16.0.0/UnicodeData.txt": "data",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.0.0", "16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await compare(context, {
        from: "15.0.0",
        to: "16.0.0",
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Object.isFrozen(data!.files.added)).toBe(true);
      expect(Object.isFrozen(data!.files.removed)).toBe(true);
      expect(Object.isFrozen(data!.files.modified)).toBe(true);
      expect(Object.isFrozen(data!.files.unchanged)).toBe(true);
    });
  });

  describe("comparison mode", () => {
    describe("manual mode selection", () => {
      it("should use local-local mode when specified", async () => {
        let apiCallCount = 0;
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          onRequest: () => {
            apiCallCount++;
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/15.0.0/UnicodeData.txt": "data15",
            "/test/16.0.0/UnicodeData.txt": "data16",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["15.0.0", "16.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "local-local",
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(apiCallCount).toBe(0);
      });

      it("should use api-api mode when specified with allowApi", async () => {
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          responses: {
            "/api/v1/versions/{version}/file-tree": ({ params }) => {
              if (params.version === "15.0.0") {
                return HttpResponse.json([
                  { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
                ] satisfies UnicodeTree);
              }
              return HttpResponse.json([
                { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
                { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
              ] satisfies UnicodeTree);
            },
            "/api/v1/files/{wildcard}": ({ params }) => {
              const filePath = params.wildcard ?? "";
              if (filePath.includes("15.0.0")) {
                return HttpResponse.text("api-content-15");
              }
              return HttpResponse.text("api-content-16");
            },
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS();

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: [],
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "api-api",
          allowApi: true,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.files.added).toContain("NewFile.txt");
      });

      it("should use local-api mode when specified", async () => {
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          responses: {
            "/api/v1/versions/{version}/file-tree": ({ params }) => {
              if (params.version === "16.0.0") {
                return HttpResponse.json([
                  { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
                  { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
                ] satisfies UnicodeTree);
              }
              return HttpResponse.json([
                { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              ] satisfies UnicodeTree);
            },
            "/api/v1/files/{wildcard}": ({ params }) => {
              const filePath = params.wildcard ?? "";
              if (filePath.includes("16.0.0")) {
                return HttpResponse.text("api-content-16");
              }
              return HttpResponse.text("local-content");
            },
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/15.0.0/UnicodeData.txt": "local-content-15",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["15.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "local-api",
          allowApi: true,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.files.added).toContain("NewFile.txt");
      });

      it("should use api-local mode when specified", async () => {
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          responses: {
            "/api/v1/versions/{version}/file-tree": ({ params }) => {
              if (params.version === "15.0.0") {
                return HttpResponse.json([
                  { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
                  { type: "file", name: "OldFile.txt", path: "OldFile.txt", lastModified: Date.now() },
                ] satisfies UnicodeTree);
              }
              return HttpResponse.json([
                { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              ] satisfies UnicodeTree);
            },
            "/api/v1/files/{wildcard}": ({ params }) => {
              const filePath = params.wildcard ?? "";
              if (filePath.includes("15.0.0")) {
                return HttpResponse.text("api-content-15");
              }
              return HttpResponse.text("local-content");
            },
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/16.0.0/UnicodeData.txt": "local-content-16",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["16.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "api-local",
          allowApi: true,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.files.removed).toContain("OldFile.txt");
      });
    });

    describe("mode validation", () => {
      it("should throw error when local-local mode is used but 'from' version is not local", async () => {
        mockStoreApi({
          versions: ["16.0.0"],
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/16.0.0/UnicodeData.txt": "data",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["16.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [_data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "local-local",
        });

        expect(error).toBeInstanceOf(UCDStoreGenericError);
        expect(error?.message).toMatch(/Cannot use mode 'local-local'/);
        expect(error?.message).toMatch(/not available locally/);
      });

      it("should throw error when local-local mode is used but 'to' version is not local", async () => {
        mockStoreApi({
          versions: ["15.0.0"],
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/15.0.0/UnicodeData.txt": "data",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["15.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [_data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "local-local",
        });

        expect(error).toBeInstanceOf(UCDStoreGenericError);
        expect(error?.message).toMatch(/Cannot use mode 'local-local'/);
        expect(error?.message).toMatch(/not available locally/);
      });

      it("should throw error when api mode is used without allowApi", async () => {
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/15.0.0/UnicodeData.txt": "data",
            "/test/16.0.0/UnicodeData.txt": "data",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["15.0.0", "16.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [_data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          mode: "api-api",
          allowApi: false,
        });

        expect(error).toBeInstanceOf(UCDStoreGenericError);
        expect(error?.message).toMatch(/Cannot use mode 'api-api'/);
        expect(error?.message).toMatch(/allowApi is false/);
      });
    });

    describe("auto-detection", () => {
      it("should auto-detect local-local when both versions are local", async () => {
        let apiCallCount = 0;
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          onRequest: () => {
            apiCallCount++;
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/15.0.0/UnicodeData.txt": "data15",
            "/test/16.0.0/UnicodeData.txt": "data16",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["15.0.0", "16.0.0"],
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          allowApi: true, // Even with allowApi, should prefer local
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(apiCallCount).toBe(0);
      });

      it("should auto-detect local-api when 'from' is local but 'to' is not", async () => {
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          responses: {
            "/api/v1/versions/{version}/file-tree": ({ params }) => {
              if (params.version === "16.0.0") {
                return HttpResponse.json([
                  { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
                ] satisfies UnicodeTree);
              }
              return HttpResponse.json([]);
            },
            "/api/v1/files/{wildcard}": () => HttpResponse.text("api-content"),
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS({
          initialFiles: {
            "/test/15.0.0/UnicodeData.txt": "local-content",
          },
        });

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: ["15.0.0"], // Only 15.0.0 is local
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          allowApi: true,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it("should auto-detect api-api when neither version is local", async () => {
        mockStoreApi({
          versions: ["15.0.0", "16.0.0"],
          responses: {
            "/api/v1/versions/{version}/file-tree": () => {
              return HttpResponse.json([
                { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              ] satisfies UnicodeTree);
            },
            "/api/v1/files/{wildcard}": () => HttpResponse.text("api-content"),
          },
        });

        const filter = createPathFilter({});
        const fs = createMemoryMockFS();

        const context = createInternalContext({
          client,
          filter,
          fs,
          basePath: "/test",
          versions: [], // No local versions
          manifestPath: "/test/.ucd-store.json",
        });

        const [data, error] = await compare(context, {
          from: "15.0.0",
          to: "16.0.0",
          allowApi: true,
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });
  });
});
