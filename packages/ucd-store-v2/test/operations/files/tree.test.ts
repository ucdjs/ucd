import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../../src/core/context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFileTree } from "../../../src/operations/files/tree";

describe("getFileTree", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  describe("successful file tree retrieval", () => {
    it("should get file tree for valid version", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

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

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "ArabicShaping.txt",
          type: "file",
        }),
        expect.objectContaining({
          name: "extracted",
          type: "directory",
        }),
      ]));
    });

    it("should return hierarchical tree structure", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

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

      const [data, _error] = await getFileTree(context, "16.0.0");

      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "extracted",
          type: "directory",
          children: expect.arrayContaining([
            expect.objectContaining({
              name: "DerivedBidiClass.txt",
              type: "file",
              path: expect.any(String),
            }),
          ]),
        }),
      ]));
    });

    it("should work with multiple versions in context", async () => {
      mockStoreApi({ versions: ["16.0.0", "15.1.0", "15.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "15.1.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();

      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "ArabicShaping.txt",
          type: "file",
        }),
        expect.objectContaining({
          name: "BidiBrackets.txt",
          type: "file",
        }),
        expect.objectContaining({
          name: "extracted",
          type: "directory",
          children: [
            expect.objectContaining({
              name: "DerivedBidiClass.txt",
              type: "file",
            }),
          ],
        }),
      ]));
    });
  });

  describe("version validation", () => {
    it("should throw UCDStoreVersionNotFoundError for non-existent version", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

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

      const [data, error] = await getFileTree(context, "99.0.0");

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("99.0.0");
      expect(data).toBeNull();
    });

    it("should validate version before making API call", async () => {
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount++;
        },
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

      const [_data, error] = await getFileTree(context, "invalid-version");

      expect(callCount).toBe(0);
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toMatch(/Version '(.*)' does not exist in the store./);
    });
  });

  describe("global filter application", () => {
    it("should apply global include filters to tree structure", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ include: ["**/*.txt"] });
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "ArabicShaping.txt",
          type: "file",
          path: expect.stringMatching(/\.txt$/),
        }),
        expect.objectContaining({
          name: "extracted",
          type: "directory",
          children: expect.arrayContaining([
            expect.objectContaining({
              type: "file",
              path: expect.stringMatching(/\.txt$/),
            }),
          ]),
        }),
      ]));
    });

    it("should apply global exclude filters to tree structure", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ exclude: ["**/*.txt"] });
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "extracted",
          type: "directory",
        }),
      ]));
    });
  });

  describe("method-specific filter application", () => {
    it("should apply method-specific include filters on top of global filters", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

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

      const [data, error] = await getFileTree(context, "16.0.0", {
        filters: { include: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "ArabicShaping.txt",
          type: "file",
          path: expect.stringMatching(/\.txt$/),
        }),
        expect.objectContaining({
          name: "extracted",
          type: "directory",
          children: expect.arrayContaining([
            expect.objectContaining({
              type: "file",
              path: expect.stringMatching(/\.txt$/),
            }),
          ]),
        }),
      ]));
    });

    it("should apply method-specific exclude filters on top of global filters", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

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

      const [data, error] = await getFileTree(context, "16.0.0", {
        filters: { exclude: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "extracted",
          type: "directory",
        }),
      ]));
    });

    it("should combine global and method-specific filters", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ include: ["**/*"] });
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "16.0.0", {
        filters: { exclude: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "extracted",
          type: "directory",
        }),
      ]));
    });
  });

  describe("nested tree filtering", () => {
    it("should filter nested directory structures", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ include: ["**/*.txt"] });
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "ArabicShaping.txt",
          type: "file",
        }),
        expect.objectContaining({
          name: "extracted",
          type: "directory",
          children: expect.arrayContaining([
            expect.objectContaining({
              type: "file",
              path: expect.stringMatching(/\.txt$/),
            }),
          ]),
        }),
      ]));
    });

    it("should preserve directory hierarchy even when filtering files", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ include: ["**/*.txt"] });
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: "ArabicShaping.txt",
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
      ]));
    });
  });

  describe("api error handling", () => {
    it("should handle API errors gracefully", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": {
            status: 500,
            message: "Internal Server Error",
            timestamp: new Date().toISOString(),
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
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFileTree(context, "16.0.0");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file tree");
      expect(data).toBeNull();
    });

    it("should include version in error message", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": {
            status: 404,
            message: "Not Found",
            timestamp: new Date().toISOString(),
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
        versions: ["15.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await getFileTree(context, "15.0.0");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("15.0.0");
    });
  });

  it("should handle empty file tree", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [],
      },
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

    const [data, error] = await getFileTree(context, "16.0.0");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toEqual([]);
  });

  it("should handle filters that exclude all files", async () => {
    mockStoreApi({ versions: ["16.0.0"] });

    const filter = createPathFilter({ include: ["**/*.nonexistent"] });
    const fs = createMemoryMockFS();
    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await getFileTree(context, "16.0.0");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
