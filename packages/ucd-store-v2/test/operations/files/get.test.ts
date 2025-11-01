import { mockStoreApi } from "#test-utils";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../../src/core/context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFile } from "../../../src/operations/files/get";

describe("getFile", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  describe("local store (default behavior)", () => {
    it("should read file from local store when it exists", async () => {
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
          "/test/16.0.0/UnicodeData.txt": "Local content",
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("Local content");
      expect(callCount).toBe(0);
    });

    it("should throw error when file does not exist locally", async () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/File '(.*)' does not exist in local store/);
    });

    it("should throw error when local read fails", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.on("read:before", () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to read file '(.*)' from local store/);
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
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "Local content",
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("Local content");
      expect(callCount).toBe(0);
    });

    it("should fetch from API when file not in local store", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("API content");
    });

    it("should fall back to API when local read fails", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "content",
        },
      });

      fs.on("read:before", () => {
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("API content");
    });

    it("should cache file after API fetch by default", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
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

      const fileExists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(fileExists).toBe(false);

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe("API content");

      const fileExistsAfter = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(fileExistsAfter).toBe(true);

      const cached = await fs.read!("/test/16.0.0/UnicodeData.txt");
      expect(cached).toBe("API content");
    });

    it("should not cache when cache option is false", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content",
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
        cache: false,
      });

      const fileExists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(fileExists).toBe(false);

      expect(error).toBeNull();
      expect(data).toBe("API content");

      const exists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });

    it("should handle API errors", async () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to fetch file '(.*)'/);
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

      const [_data, error] = await getFile(context, "99.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toMatch(/Version '\d+\.\d+\.\d+' does not exist in the store/);
    });

    it("should throw error when file does not pass filters", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ exclude: ["**/UnicodeData.txt"] });
      const fs = createMemoryMockFS();

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/File '(.*)' does not pass filters/);
    });
  });
});
