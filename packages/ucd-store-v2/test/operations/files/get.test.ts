import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { HttpResponse } from "#test-utils/msw";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { setupMockStore as mockStoreApi } from "@ucdjs/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createInternalContext } from "../../../src/core/context";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { getFile } from "../../../src/operations/files/get";

describe("getFile", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  describe("successful file retrieval from local FS", () => {
    it("should read file from local FS when it exists", async () => {
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

      // pre-populate local FS with a file
      await fs.write!("/test/16.0.0/UnicodeData.txt", "Test content from local FS");

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("Test content from local FS");
    });

    it("should prefer local FS over API when file exists locally", async () => {
      // TODO: extend mockStoreApi to verify API hasn't been called
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

      // pre-populate local FS
      await fs.write!("/test/16.0.0/UnicodeData.txt", "Local version");

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("Local version");
    });
  });

  describe("api fallback when file not in local FS", () => {
    it("should fetch from API when file not in local FS", async () => {
      let callCount = 0;
      const apiResponse = "Content from API";
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": async () => {
            callCount += 1;
            return HttpResponse.text(apiResponse);
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toBe(apiResponse);
      expect(callCount).toBe(1);
    });

    it("should fallback to API when local read fails", async () => {
      let callCount = 0;
      const apiResponse = "Content from API after local fail";
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": async () => {
            callCount += 1;
            return HttpResponse.text(apiResponse);
          },
        },
      });

      const readFailure = vi.fn(async () => {
        throw new Error("Simulated read failure");
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS({
        hooks: {
          "read:before": readFailure,
        },
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "This content won't be read",
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
      expect(data).toBeDefined();
      expect(data).toBe(apiResponse);
      expect(callCount).toBe(1);
      expect(readFailure).toHaveBeenCalledWith({
        input: {
          path: "/test/16.0.0/UnicodeData.txt",
        },
        state: expect.any(Object),
      });
    });
  });

  describe("file caching", () => {
    it("should cache file to local FS after API fetch by default", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "API content to cache",
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // verify file was cached
      const cached = await fs.read!("/test/16.0.0/UnicodeData.txt");
      expect(cached).toBeDefined();
    });

    it("should not cache when cache option is false", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "API content no cache",
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
        cache: false,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Verify file was not cached
      const exists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });

    it("should not cache with read-only FS bridge", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "API content",
        },
      });

      const filter = createPathFilter({});
      const readOnlyFS = defineFileSystemBridge({
        meta: {
          name: "Read-Only Bridge",
          description: "A bridge without write capability",
        },
        setup() {
          return {
            async read() {
              throw new Error("File not found");
            },
            async exists() {
              return false;
            },
            async listdir() {
              return [];
            },
          };
        },
      })();

      const context = createInternalContext({
        client,
        filter,
        fs: readOnlyFS,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // No error should be thrown for lack of write capability
    });

    it("should handle cache write failures gracefully", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "API content",
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();

      // Override write to simulate failure
      fs.write = async () => {
        throw new Error("Simulated write failure");
      };

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      // Should succeed despite cache failure
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("response type handling", () => {
    it("should handle string response from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "Plain text content",
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

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(typeof data).toBe("string");
      expect(data).toBe("Plain text content");
    });

    it("should convert JSON response to string", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": { key: "value", nested: { data: 123 } },
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

      const [data, error] = await getFile(context, "16.0.0", "data.json");

      expect(error).toBeNull();
      expect(typeof data).toBe("string");

      // Should be valid JSON string
      const parsed = JSON.parse(data!);
      expect(parsed).toEqual({ key: "value", nested: { data: 123 } });
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

      const [_data, error] = await getFile(context, "99.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("99.0.0");
    });

    it("should validate version before checking local FS", async () => {
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

      const [_data, error] = await getFile(context, "invalid-version", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
    });
  });

  describe("filter validation", () => {
    it("should throw error when file does not pass filters", async () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "data.json");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not pass filters");
    });

    it("should apply global filters", async () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not pass filters");
    });

    it("should apply method-specific filters on top of global filters", async () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        filters: { exclude: ["**/*.txt"] },
      });

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not pass filters");
    });

    it("should check filters before attempting file operations", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({ include: ["**/*.json"] });
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      // Pre-populate local FS
      await fs.write!("/test/16.0.0/UnicodeData.txt", "content");

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      // Should fail due to filter, not attempt to read file
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not pass filters");
    });
  });

  describe("aPI error handling", () => {
    it("should handle API errors gracefully", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": {
            status: 500,
            message: "Internal Server Error",
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file");
    });

    it("should handle 404 errors from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": {
            status: 404,
            message: "Not Found",
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

      const [_data, error] = await getFile(context, "16.0.0", "NonExistent.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file");
    });

    it("should include file path and version in error message", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
        responses: {
          "/api/v1/files/:wildcard": {
            status: 500,
            message: "Server Error",
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

      const [_data, error] = await getFile(context, "15.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("UnicodeData.txt");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string response from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "",
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

      const [data, error] = await getFile(context, "16.0.0", "empty.txt");

      expect(error).toBeNull();
      expect(data).toBe("");
    });

    it("should handle files with special characters in path", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "Content",
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

      const [data, error] = await getFile(context, "16.0.0", "path/with-dashes_and_underscores.txt");

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should handle nested file paths", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/:wildcard": "Nested content",
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

      const [data, error] = await getFile(context, "16.0.0", "extracted/DerivedAge.txt");

      expect(error).toBeNull();
      expect(data).toBe("Nested content");
    });
  });
});
