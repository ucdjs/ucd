import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../../src/core/context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { listFiles } from "../../../src/operations/files/list";

describe("listFiles", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  describe("successful file listing", () => {
    it("should list files for valid version", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should return flat array of file paths", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(typeof path).toBe("string");
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

      const [data, error] = await listFiles(context, "15.1.0");

      expect(error).toBeNull();
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

      const [data, error] = await listFiles(context, "99.0.0");

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("99.0.0");
      expect(data).toBeNull();
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
      const [data, error] = await listFiles(context, "invalid-version");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
    });
  });

  describe("global filter application", () => {
    it("should apply global include filters", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(path).toMatch(/\.txt$/);
      });
    });

    it("should apply global exclude filters", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(path).not.toMatch(/\.txt$/);
      });
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

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: { include: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(path).toMatch(/\.txt$/);
      });
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

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: { exclude: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(path).not.toMatch(/\.txt$/);
      });
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

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: { exclude: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(path).not.toMatch(/\.txt$/);
      });
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

      const [data, error] = await listFiles(context, "16.0.0");

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

      const [data, error] = await listFiles(context, "15.0.0");

      expect(data).toBeNull();
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

      const [data, error] = await listFiles(context, "16.0.0");

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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual([]);
    });
  });
});
