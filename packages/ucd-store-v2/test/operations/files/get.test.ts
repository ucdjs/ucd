import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFile } from "../../../src/operations/files/get";

describe("getFile", () => {
  describe("local store (default behavior)", () => {
    it("should read file from local store when it exists", async () => {
      // Arrange
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
          "/test/v16.0.0/UnicodeData.txt": "Local content",
        },
      });

      // Act
      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      // Assert
      expect(error).toBeNull();
      expect(data).toBe("Local content");
      expect(callCount).toBe(0);
    });

    it("should throw error when file does not exist locally", async () => {
      // Arrange
      mockStoreApi({ versions: ["16.0.0"] });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/File '(.*)' does not exist in local store/);
    });

    it("should throw error when local read fails", async () => {
      // Arrange
      mockStoreApi({ versions: ["16.0.0"] });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("read:before", () => {
        throw new Error("Read failed");
      });

      // Act
      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to read file '(.*)' from local store/);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("API fallback (allowApi: true)", () => {
    it("should prefer local store over API", async () => {
      // Arrange
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount++;
        },
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/UnicodeData.txt": "Local content",
        },
      });

      // Act
      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBe("Local content");
      expect(callCount).toBe(0);
    });

    it("should fetch from API when file not in local store", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBe("API content");
    });

    it("should fall back to API when local read fails", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        initialFiles: {
          "/test/v16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.hook("read:before", () => {
        throw new Error("Read failed");
      });

      // Act
      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBe("API content");
    });

    it("should cache file after API fetch by default", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      const fileExists = await fs.exists("/test/v16.0.0/UnicodeData.txt");
      expect(fileExists).toBe(false);

      // Act
      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toBe("API content");

      const fileExistsAfter = await fs.exists("/test/v16.0.0/UnicodeData.txt");
      expect(fileExistsAfter).toBe(true);

      const cached = await fs.read!("/test/v16.0.0/UnicodeData.txt");
      expect(cached).toBe("API content");
    });

    it("should not cache when cache option is false", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const { context, fs } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
        cache: false,
      });

      // Assert
      const fileExists = await fs.exists("/test/v16.0.0/UnicodeData.txt");
      expect(fileExists).toBe(false);

      expect(error).toBeNull();
      expect(data).toBe("API content");

      const exists = await fs.exists("/test/v16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });

    it("should handle API errors", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": {
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

      // Act
      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to fetch file '(.*)'/);
    });
  });

  describe("validation", () => {
    it("should throw error for non-existent version", async () => {
      // Arrange
      mockStoreApi({ versions: ["16.0.0"] });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const [_data, error] = await getFile(context, "99.0.0", "UnicodeData.txt");

      // Assert
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toMatch(/Version '\d+\.\d+\.\d+' does not exist in the store/);
    });

    it("should throw error when file does not pass filters", async () => {
      // Arrange
      mockStoreApi({ versions: ["16.0.0"] });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
        globalFilters: { exclude: ["**/UnicodeData.txt"] },
      });

      // Act
      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/File '(.*)' does not pass filters/);
    });
  });
});
