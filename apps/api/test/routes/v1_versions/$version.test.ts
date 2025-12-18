import type { Entry } from "apache-autoindex-parse";
import type { TraverseEntry } from "apache-autoindex-parse/traverse";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { env, fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";
import { expectApiError, expectCacheHeaders, expectJsonResponse, expectSuccess } from "../../helpers/response";

// mock the unicode-utils-new module
vi.mock("@unicode-utils/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@unicode-utils/core")>();

  return {
    ...original,
    getCurrentDraftVersion: vi.fn(() => {
      return original.getCurrentDraftVersion();
    }),
    resolveUCDVersion: vi.fn((version) => {
      return original.resolveUCDVersion(version);
    }),
  };
});

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
  vi.resetAllMocks();
});

describe("v1_versions", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/versions/{version}/file-tree", () => {
    const files: TraverseEntry[] = [
      { type: "file", name: "file1.txt", path: "Public/15.1.0/ucd/file1.txt" },
      { type: "file", name: "file2.txt", path: "Public/15.1.0/ucd/file2.txt" },
      { type: "directory", name: "subdir", path: "Public/15.1.0/ucd/subdir", children: [] },
      { type: "file", name: "file3.txt", path: "Public/15.1.0/ucd/subdir/file3.txt" },
      { type: "file", name: "emoji-data.txt", path: "Public/15.1.0/ucd/emoji/emoji-data.txt" },
    ];

    it("should return files for a valid Unicode version", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);
      const data = await json() as unknown[];
      expect(Array.isArray(data)).toBe(true);

      const expectedFiles = files.map((file) => {
        return expect.objectContaining({
          name: file.name,
          path: file.path,
          type: file.type,
          ...(file.type === "directory" ? { children: file.children } : {}),
        });
      });

      expect(data).toEqual(expect.arrayContaining(expectedFiles));
    });

    it("should return files for latest version", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/latest/file-tree"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);
      const data = await json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return structured file data with proper schema", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);

      const data = await json() as TraverseEntry[];

      // validate the response structure
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const [filesEntries, directoryEntries] = data.reduce(
        ([files, directories], item) => {
          if (item.type === "file") {
            files.push(item);
          } else if (item.type === "directory") {
            directories.push(item);
          }

          return [files, directories];
        },
        [[], []] as [Entry[], TraverseEntry[]],
      );

      expect(filesEntries.length).toBeGreaterThan(0);
      expect(directoryEntries.length).toBeGreaterThan(0);

      // check that each file object has the required properties
      expect(filesEntries).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          path: expect.any(String),
          type: expect.any(String),
        }),
      ]));

      // check that each directory object has the required properties
      expect(directoryEntries).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          path: expect.any(String),
          type: expect.any(String),
          children: expect.any(Array),
        }),
      ]));
    });

    it("should handle older Unicode versions", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/3.1-Update1" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/3.1.1/file-tree"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);
      const data = await json();
      expect(Array.isArray(data)).toBe(true);
    });

    describe("error handling", () => {
      it("should return 400 for invalid Unicode version", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/99.99.99/file-tree"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: "Invalid Unicode version",
        });
      });

      it("should return 400 for malformed version string", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/invalid-version/file-tree"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: "Invalid Unicode version",
        });
      });

      it("should return 404 for non-existent routes", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/nonexistent/file-tree"),
          env,
        );

        await expectApiError(response, { status: 400 });
      });
    });

    describe("cache", () => {
      it("should set proper cache headers", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree"),
          env,
        );

        expectSuccess(response);
        expectCacheHeaders(response);
      });

      it("should cache the response for subsequent requests", async () => {
        let callCounter = 0;
        fetchMock.get("https://unicode.org")
          .intercept({ path: "/Public/16.0.0/ucd" })
          .reply(200, () => {
            callCounter++;
            return generateAutoIndexHtml(files, "F2");
          }).persist();

        const { response: firstResponse } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree"),
          env,
        );
        expectSuccess(firstResponse);
        expect(callCounter).toBe(1); // First call should hit the network
        expect(firstResponse.headers.get("cf-cache-status")).toBeNull();

        const { response: secondResponse } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree"),
          env,
        );

        expectSuccess(secondResponse);
        expect(callCounter).toBe(1); // Second call should hit the cache
        expect(secondResponse.headers.get("cf-cache-status")).toBe("HIT");
      });

      it("should not cache responses for invalid versions", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/invalid-version/file-tree"),
          env,
        );

        await expectApiError(response, { status: 400 });
        expect(response.headers.get("cf-cache-status")).toBeNull();
      });
    });
  });
});
