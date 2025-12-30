import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { listFiles } from "../../../src/files/list";

describe("listFiles", () => {
  describe("version validation", () => {
    it("should return error when version is not in resolved versions", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await listFiles(context, "15.0.0");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("15.0.0");
    });

    it("should return error when resolved versions is empty", async () => {
      const { context } = await createTestContext({
        versions: [],
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
    });
  });

  describe("default behavior (reading from bridge)", () => {
    it("should return list of file paths from bridge", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
          "/test/16.0.0/Scripts.txt": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(3);
      expect(data).toContain("UnicodeData.txt");
      expect(data).toContain("Blocks.txt");
      expect(data).toContain("Scripts.txt");
    });

    it("should return files from nested directories with full paths", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/auxiliary/GraphemeBreakProperty.txt": "content",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("UnicodeData.txt");
      expect(data).toContain("auxiliary/GraphemeBreakProperty.txt");
      expect(data).toContain("extracted/DerivedBidiClass.txt");
    });

    it("should return empty array when version directory does not exist", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should return empty array when listdir fails", async () => {
      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("listdir:before", () => {
        throw new Error("Listdir failed");
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should not make API calls when reading from bridge", async () => {
      let apiCalled = false;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          apiCalled = true;
        },
        responses: {
          "/api/v1/versions": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(apiCalled).toBe(false);
    });
  });

  describe("filter application", () => {
    it("should apply global include filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["*.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
          "/test/16.0.0/emoji-data.json": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("UnicodeData.txt");
      expect(data).toContain("Blocks.txt");
      expect(data).not.toContain("emoji-data.json");
    });

    it("should apply global exclude filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          exclude: ["**/extracted/**"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/extracted/DerivedBidiClass.txt": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0");

      expect(error).toBeNull();
      expect(data).toContain("UnicodeData.txt");
      expect(data).not.toContain("extracted/DerivedBidiClass.txt");
    });

    it("should apply per-request filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
          "/test/16.0.0/Scripts.txt": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: {
          include: ["UnicodeData.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).toEqual(["UnicodeData.txt"]);
    });

    it("should combine global and per-request filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["*.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
          "/test/16.0.0/Blocks.txt": "content",
          "/test/16.0.0/data.json": "content",
        },
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        filters: {
          exclude: ["Blocks.txt"],
        },
      });

      expect(error).toBeNull();
      expect(data).toContain("UnicodeData.txt");
      expect(data).not.toContain("Blocks.txt");
      expect(data).not.toContain("data.json");
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("API fallback (allowApi: true)", () => {
    it("should fetch from API when local directory does not exist", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
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
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should prefer bridge over API when both available", async () => {
      let apiCalled = false;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          apiCalled = true;
        },
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
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

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(apiCalled).toBe(false);
    });

    it("should fall back to API when listdir fails", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
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
        throw new Error("Listdir failed");
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should return error when API request fails", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": () => new HttpResponse(null, { status: 500 }),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file tree");
    });

    it("should return error when API returns no data", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": () => HttpResponse.json(null),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("no data returned");
    });

    it("should apply filters to API results", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["UnicodeData.txt"],
        },
      });

      const [data, error] = await listFiles(context, "16.0.0", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toEqual(["UnicodeData.txt"]);
    });
  });

  describe("multiple versions", () => {
    it("should list files for correct version", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "v16",
          "/test/16.0.0/NewFile.txt": "v16 only",
          "/test/15.1.0/UnicodeData.txt": "v15",
        },
      });

      const [data16, error16] = await listFiles(context, "16.0.0");
      const [data15, error15] = await listFiles(context, "15.1.0");

      expect(error16).toBeNull();
      expect(error15).toBeNull();
      expect(data16).toHaveLength(2);
      expect(data16).toContain("NewFile.txt");
      expect(data15).toHaveLength(1);
      expect(data15).not.toContain("NewFile.txt");
    });
  });
});
