import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { listFiles } from "../../../src/operations/files/list";

describe("listFiles", () => {
  describe("local store (default behavior)", () => {
    it("should list files from local directory when it exists", async () => {
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount++;
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
        },
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
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

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("listdir:before", () => {
        throw new Error("Read failed");
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
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

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("listdir:before", () => {
        throw new Error("Read failed");
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to fetch file tree for version '16\.0\.0'/);
      expect(data).toBeNull();
    });

    it("should handle 'no data returned' error when API returns null", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions/{version}/file-tree": () => {
            return new HttpResponse(null, {
              status: 200,
            });
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to fetch file tree for version '16\.0\.0': no data returned/);
      expect(data).toBeNull();
    });
  });

  describe("validation", () => {
    it("should throw error for non-existent version", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { include: ["**/*.txt"] },
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { exclude: ["**/*.txt"] },
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { include: ["**/*"] },
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
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

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { include: ["**/*.nonexistent"] },
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
