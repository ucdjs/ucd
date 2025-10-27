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

  describe("local store (default behavior)", () => {
    it("should list files from local directory when it exists", async () => {
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount++;
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBe(2);
      expect(callCount).toBe(0);
    });

    it("should return empty array when directory doesn't exist locally", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
      expect(callCount).toBe(0);
    });

    it("should return empty array when local read fails", async () => {
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount++;
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.on("listdir:before", () => {
        throw new Error("Read failed");
      });

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
      expect(data).toEqual([]);
      expect(callCount).toBe(0);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("API fallback (allowApi: true)", () => {
    it("should prefer local store over API", async () => {
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount++;
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(callCount).toBe(0);
    });

    it("should fetch from API when directory doesn't exist locally", async () => {
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
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should fall back to API when local read fails", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.on("listdir:before", () => {
        throw new Error("Read failed");
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should handle API errors", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to fetch file tree for version '16\.0\.0'/);
      expect(data).toBeNull();
    });
  });

  describe("validation", () => {
    it("should throw error for non-existent version", async () => {
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
      expect(error?.message).toMatch(/Version '\d+\.\d+\.\d+' does not exist in the store/);
      expect(data).toBeNull();
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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

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
        allowApi: true,
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
        allowApi: true,
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
        allowApi: true,
        filters: { exclude: ["**/*.txt"] },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach((path) => {
        expect(path).not.toMatch(/\.txt$/);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty file tree from API", async () => {
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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toEqual([]);
    });
  });
});
