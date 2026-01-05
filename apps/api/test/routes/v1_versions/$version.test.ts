/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import type { UnicodeFileTree, UnicodeFileTreeNode } from "@ucdjs/schemas";
import type { Entry } from "apache-autoindex-parse";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { flattenFilePaths } from "@ucdjs-internal/shared";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";

vi.mock("@unicode-utils/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@unicode-utils/core")>();

  return {
    ...original,
    getCurrentDraftVersion: vi.fn(() => original.getCurrentDraftVersion()),
    resolveUCDVersion: vi.fn((version) => original.resolveUCDVersion(version)),
  };
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("v1_versions", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/versions/{version}/file-tree", () => {
    const expectedFiles = [
      { type: "file", name: "file1.txt", path: "file1.txt", lastModified: 1755287100000 },
      { type: "file", name: "file2.txt", path: "file2.txt", lastModified: 1755287100000 },
      {
        type: "directory",
        name: "subdir",
        path: "subdir/",
        lastModified: 1755287100000,
      },
      {
        type: "directory",
        name: "emoji",
        path: "emoji/",
        lastModified: 1755287100000,
      },
    ] satisfies Entry[];

    it("should return files for a valid Unicode version", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file1.txt", path: "file1.txt", lastModified: 1755287100000 },
            { type: "file", name: "file2.txt", path: "file2.txt", lastModified: 1755287100000 },
            { type: "directory", name: "subdir", path: "subdir/", lastModified: 1755287100000 },
            { type: "directory", name: "emoji", path: "emoji/", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/15.1.0/ucd/emoji", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "emoji-data.txt", path: "emoji-data.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/15.1.0/ucd/subdir", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file3.txt", path: "file3.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree"),
        env,
      );

      expect(response).toMatchResponse({
        json: true,
        status: 200,
      });

      const data = await json<UnicodeFileTree>();
      expect(Array.isArray(data)).toBe(true);

      const flattenedFilePaths = flattenFilePaths(data);

      expect(flattenedFilePaths).toEqual([
        "/15.1.0/ucd/file1.txt",
        "/15.1.0/ucd/file2.txt",
        "/15.1.0/ucd/subdir/file3.txt",
        "/15.1.0/ucd/emoji/emoji-data.txt",
      ]);
    });

    it("should return files for latest version", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/17.0.0/ucd", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file1.txt", path: "file1.txt", lastModified: 1755287100000 },
            { type: "file", name: "file2.txt", path: "file2.txt", lastModified: 1755287100000 },
            { type: "directory", name: "subdir", path: "subdir/", lastModified: 1755287100000 },
            { type: "directory", name: "emoji", path: "emoji/", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/emoji", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "emoji-data.txt", path: "emoji-data.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/subdir", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file3.txt", path: "file3.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/latest/file-tree"),
        env,
      );

      expect(response).toMatchResponse({
        json: true,
        status: 200,
      });

      const data = await json<UnicodeFileTree>();
      expect(Array.isArray(data)).toBe(true);

      const flattenedFilePaths = flattenFilePaths(data);

      expect(flattenedFilePaths).toEqual([
        "/17.0.0/ucd/file1.txt",
        "/17.0.0/ucd/file2.txt",
        "/17.0.0/ucd/subdir/file3.txt",
        "/17.0.0/ucd/emoji/emoji-data.txt",
      ]);
    });

    it("should return structured file data with proper schema", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0/ucd", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file1.txt", path: "file1.txt", lastModified: 1755287100000 },
            { type: "file", name: "file2.txt", path: "file2.txt", lastModified: 1755287100000 },
            { type: "directory", name: "subdir", path: "subdir/", lastModified: 1755287100000 },
            { type: "directory", name: "emoji", path: "emoji/", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/15.1.0/ucd/emoji", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "emoji-data.txt", path: "emoji-data.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/15.1.0/ucd/subdir", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file3.txt", path: "file3.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree"),
        env,
      );

      expect(response).toMatchResponse({
        json: true,
        status: 200,
      });

      const data = await json<UnicodeFileTree>();

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
        [[], []] as [Exclude<UnicodeFileTreeNode, { type: "directory" }>[], Exclude<UnicodeFileTreeNode, { type: "file" }>[]],
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
      mockFetch([
        ["GET", "https://unicode.org/Public/3.1-Update1", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file1.txt", path: "file1.txt", lastModified: 1755287100000 },
            { type: "file", name: "file2.txt", path: "file2.txt", lastModified: 1755287100000 },
            { type: "directory", name: "subdir", path: "subdir/", lastModified: 1755287100000 },
            { type: "directory", name: "emoji", path: "emoji/", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/3.1-Update1/emoji", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "emoji-data.txt", path: "emoji-data.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
        ["GET", "https://unicode.org/Public/3.1-Update1/subdir", () => {
          return HttpResponse.text(generateAutoIndexHtml([
            { type: "file", name: "file3.txt", path: "file3.txt", lastModified: 1755287100000 },
          ], "F2"));
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/3.1.1/file-tree"),
        env,
      );

      expect(response).toMatchResponse({
        json: true,
        status: 200,
      });
      const data = await json<UnicodeFileTree>();
      expect(Array.isArray(data)).toBe(true);

      const flattenedFilePaths = flattenFilePaths(data);

      expect(flattenedFilePaths).toEqual([
        "/3.1-Update1/file1.txt",
        "/3.1-Update1/file2.txt",
        "/3.1-Update1/subdir/file3.txt",
        "/3.1-Update1/emoji/emoji-data.txt",
      ]);
    });

    describe("error handling", () => {
      it("should return 400 for invalid Unicode version", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/99.99.99/file-tree"),
          env,
        );

        expect(response).toMatchResponse({
          status: 400,
          error: {
            message: "Invalid Unicode version",
          },
        });
      });

      it("should return 400 for malformed version string", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/invalid-version/file-tree"),
          env,
        );

        expect(response).toMatchResponse({
          status: 400,
          error: {
            message: "Invalid Unicode version",
          },
        });
      });

      it("should return 404 for non-existent routes", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/nonexistent/file-tree"),
          env,
        );

        expect(response).toMatchResponse({
          status: 400,
        });
      });
    });

    // This is marked as TODO, until Vitest Pool Workers is
    // working with cache. There is currently some issues with
    // caching being persisted across test cases.
    describe.todo("cache", () => {
      it("should set proper cache headers", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree"),
          env,
        );

        expect(response).toMatchResponse({
          status: 200,
          cache: true,
        });
      });

      it("should cache the response for subsequent requests", async () => {
        let callCounter = 0;
        mockFetch([
          ["GET", "https://unicode.org/Public/16.0.0/ucd", () => {
            callCounter++;
            return HttpResponse.text(generateAutoIndexHtml(expectedFiles, "F2"));
          }],
        ]);

        const { response: firstResponse } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree"),
          env,
        );
        expect(firstResponse).toMatchResponse({
          status: 200,
          headers: {
            "cf-cache-status": "",
          },
        });
        expect(callCounter).toBe(1); // First call should hit the network

        const { response: secondResponse } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree"),
          env,
        );

        expect(secondResponse).toMatchResponse({
          status: 200,
          headers: {
            "cf-cache-status": "HIT",
          },
        });
        expect(callCounter).toBe(1); // Second call should hit the cache
      });

      it("should not cache responses for invalid versions", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/versions/invalid-version/file-tree"),
          env,
        );

        expect(response).toMatchResponse({
          status: 400,
        });

        expect(response.headers.get("cf-cache-status")).toBeNull();
      });
    });
  });
});
