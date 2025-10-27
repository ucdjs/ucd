import { mockStoreApi, unsafeResponse } from "#test-utils";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { HttpResponse } from "#test-utils/msw";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
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
      let callCount = 0;
      mockStoreApi({
        versions: ["16.0.0"],
        onRequest: () => {
          callCount += 1;
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

      // pre-populate local FS
      await fs.write!("/test/16.0.0/UnicodeData.txt", "Local version");

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe("Local version");
      expect(callCount).toBe(0);
    });
  });

  describe("api fallback when file not in local FS", () => {
    it("should fetch from API when file not in local FS", async () => {
      let callCount = 0;
      const apiResponse = "Content from API";
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": async () => {
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
          "/api/v1/files/{wildcard}": async () => {
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
        initialFiles: {
          "/test/16.0.0/UnicodeData.txt": "This content won't be read",
        },
      });

      fs.on("read:before", readFailure);

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
        path: "/test/16.0.0/UnicodeData.txt",
      });
    });
  });

  describe("file caching", () => {
    it("should cache file to local FS after API fetch by default", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "API content to cache",
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
          "/api/v1/files/{wildcard}": "API content no cache",
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

      // verify file was not cached
      const exists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });

    it("should not cache with read-only FS bridge", async () => {
      const apiResponseContent = "API content";

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": apiResponseContent,
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
      expect(data).toBe(apiResponseContent);

      // verify file was not cached
      const exists = await readOnlyFS.exists("/test/16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });

    it("should handle cache write failures gracefully", async () => {
      const apiResponseContent = "API content";
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": apiResponseContent,
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();

      fs.on("write:before", () => {
        throw new Error("Simulated write failure");
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

      // should succeed despite cache failure
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toBe(apiResponseContent);

      // verify file was not cached
      const exists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });
  });

  describe("response type handling", () => {
    it("should handle string response from API", async () => {
      const plainTextContent = "Plain text content";
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": plainTextContent,
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
      expect(data).toBe(plainTextContent);
    });

    it("should convert JSON response to string", async () => {
      const customResponse = {
        key: "value",
        nested: { data: 123 },
      };

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": unsafeResponse(customResponse),
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

      const parsed = JSON.parse(data!);
      expect(parsed).toStrictEqual(customResponse);
    });
  });

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

  it("should handle combined include and exclude filters for different file paths", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/files/{wildcard}": ({ params }) => {
          if (params.wildcard === "16.0.0/data.txt") {
            return HttpResponse.text("Content for data.txt");
          }

          // For other files, return a default or let it fail as needed
          return HttpResponse.text("Unexpected file");
        },
      },
    });

    const filter = createPathFilter({
      include: ["**/*.txt"],
      exclude: ["**/UnicodeData.txt"],
    });

    const fs = createMemoryMockFS();
    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await getFile(context, "16.0.0", "data.txt");
    expect(error).toBeNull();
    expect(data).toBe("Content for data.txt");

    const [_data, error2] = await getFile(context, "16.0.0", "UnicodeData.txt");
    expect(error2).toBeInstanceOf(UCDStoreGenericError);
    expect(error2?.message).toMatch(/File '(.*)' does not pass filters/);
  });

  describe("api error handling", () => {
    it("should handle API errors gracefully", async () => {
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

      const [_data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toMatch(/Failed to fetch file 'UnicodeData.txt':/);
    });

    it("should handle 404 errors from API", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": {
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
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const [_data, error] = await getFile(context, "16.0.0", "NonExistent.txt");

      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file");
    });
  });

  it("should handle empty string response from API", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/files/{wildcard}": "",
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

  it("should handle nested file paths", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/files/{wildcard}": "Nested content",
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
