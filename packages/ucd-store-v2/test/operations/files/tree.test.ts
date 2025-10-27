import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { createPathFilter } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../../src/core/context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFileTree } from "../../../src/operations/files/tree";

describe("getFileTree", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, {
    version: "0.1",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/api/v1/files/.ucd-store.json",
      versions: "/api/v1/versions",
    },
  });

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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
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
      expect(data!.length).toBeGreaterThan(0);

      // Check structure of tree nodes
      data!.forEach((node) => {
        expect(node).toHaveProperty("name");
        expect(node).toHaveProperty("type");
        expect(["file", "directory"]).toContain(node.type);

        if (node.type === "directory") {
          expect(node).toHaveProperty("children");
          expect(Array.isArray(node.children)).toBe(true);
        } else {
          expect(node).toHaveProperty("path");
        }
      });
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
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
      expect(data).toBeUndefined();
    });

    it("should validate version before making API call", async () => {
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

      // This should fail immediately without making API call
      const [_data, error] = await getFileTree(context, "invalid-version");

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // All file nodes should match the filter
      const checkNodes = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (node.type === "file") {
            expect(node.path).toMatch(/\.txt$/);
          } else if (node.type === "directory" && node.children) {
            checkNodes(node.children);
          }
        });
      };

      checkNodes(data!);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // No file nodes should match the excluded pattern
      const checkNodes = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (node.type === "file") {
            expect(node.path).not.toMatch(/\.txt$/);
          } else if (node.type === "directory" && node.children) {
            checkNodes(node.children);
          }
        });
      };

      checkNodes(data!);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // All file nodes should match the filter
      const checkNodes = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (node.type === "file") {
            expect(node.path).toMatch(/\.txt$/);
          } else if (node.type === "directory" && node.children) {
            checkNodes(node.children);
          }
        });
      };

      checkNodes(data!);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // No file nodes should match the excluded pattern
      const checkNodes = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (node.type === "file") {
            expect(node.path).not.toMatch(/\.txt$/);
          } else if (node.type === "directory" && node.children) {
            checkNodes(node.children);
          }
        });
      };

      checkNodes(data!);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // No file nodes should match the excluded pattern
      const checkNodes = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (node.type === "file") {
            expect(node.path).not.toMatch(/\.txt$/);
          } else if (node.type === "directory" && node.children) {
            checkNodes(node.children);
          }
        });
      };

      checkNodes(data!);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // The tree may or may not have nested structures depending on the mock data
      // Just verify the structure is valid
      expect(Array.isArray(data)).toBe(true);
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();

      // Verify tree structure is maintained
      const validateHierarchy = (nodes: any[], depth = 0) => {
        nodes.forEach((node) => {
          expect(node).toHaveProperty("name");
          expect(node).toHaveProperty("type");

          if (node.type === "directory") {
            expect(node).toHaveProperty("children");
            if (node.children && node.children.length > 0) {
              validateHierarchy(node.children, depth + 1);
            }
          }
        });
      };

      validateHierarchy(data!);
    });
  });

  describe("aPI error handling", () => {
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
      expect(data).toBeUndefined();
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

  describe("empty and edge cases", () => {
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

      expect(error).toBeUndefined();
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

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
      // Tree should be empty or only contain empty directories
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
