import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreFilterError, UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFile } from "../../../src/files/get";

describe("getFile", () => {
  describe("version validation", () => {
    it("should return error when version is not in resolved versions", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFile(context, "15.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("15.0.0");
    });

    it("should return error when resolved versions is empty", async () => {
      const { context } = await createTestContext({
        versions: [],
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
    });
  });

  describe("filter validation", () => {
    it("should return error when file does not pass include filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["*.xml"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreFilterError);
      expect(error?.message).toContain("does not pass filters");
    });

    it("should return error when file matches exclude filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          exclude: ["UnicodeData.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreFilterError);
      expect(error?.message).toContain("does not pass filters");
    });

    it("should allow file when it passes filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: {
          include: ["*.txt"],
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("content");
    });
  });

  describe("default behavior (reading from bridge)", () => {
    it("should return file content from bridge", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    });

    it("should return file from nested path", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/auxiliary/GraphemeBreakProperty.txt": "grapheme data",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "auxiliary/GraphemeBreakProperty.txt");

      expect(error).toBeNull();
      expect(data).toBe("grapheme data");
    });

    it("should return error when file does not exist (without allowApi)", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not exist in local store");
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
          "/test/16.0.0/UnicodeData.txt": "local content",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("local content");
      expect(apiCalled).toBe(false);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("API fallback (allowApi: true)", () => {
    it("should fetch from API when file not in bridge", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": "API content for UnicodeData",
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("API content for UnicodeData");
    });

    it("should prefer local file over API when both available", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "local content",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("local content");
    });

    it("should return error when API request fails", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/files/{wildcard}": () => new HttpResponse(null, { status: 404 }),
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file");
    });
  });

  describe("per-request filters", () => {
    it("should apply per-request filters in addition to global filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        filters: {
          exclude: ["UnicodeData.txt"],
        },
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not pass filters");
    });
  });

  describe("multiple versions", () => {
    it("should read correct file for each version", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "version 16 data",
          "/test/15.1.0/UnicodeData.txt": "version 15 data",
        },
      });

      const [data16, error16] = await getFile(context, "16.0.0", "UnicodeData.txt");
      const [data15, error15] = await getFile(context, "15.1.0", "UnicodeData.txt");

      expect(error16).toBeNull();
      expect(error15).toBeNull();
      expect(data16).toBe("version 16 data");
      expect(data15).toBe("version 15 data");
    });
  });
});
