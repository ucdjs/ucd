import type { ApiError, UnicodeTree } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { client } from "@ucdjs/client";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { getExpectedFilePaths } from "../../src/internal/files";

describe("getExpectedFilePaths", () => {
  it("should return flattened file paths for valid version", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json([
          {
            type: "file",
            name: "ReadMe.txt",
            path: "/ReadMe.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "/UnicodeData.txt",
            lastModified: Date.now(),
          },
          {
            type: "directory",
            name: "ucd",
            path: "/ucd",
            lastModified: Date.now(),
            children: [
              {
                type: "file",
                name: "emoji-data.txt",
                path: "/emoji-data.txt",
                lastModified: Date.now(),
              },
            ],
          },
        ] satisfies UnicodeTree);
      }],
    ]);

    const result = await getExpectedFilePaths(client, "15.0.0");

    expect(result).toEqual([
      "/ReadMe.txt",
      "/UnicodeData.txt",
      "/ucd/emoji-data.txt",
    ]);
  });

  it("should throw UCDStoreGenericError when API returns error", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json({
          message: "Version not found",
          status: 404,
          timestamp: new Date().toISOString(),
        } satisfies ApiError, { status: 404 });
      }],
    ]);

    await expect(
      getExpectedFilePaths(client, "15.0.0"),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should handle empty file tree", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json([], { status: 200 });
      }],
    ]);

    const result = await getExpectedFilePaths(client, "15.0.0");

    expect(result).toEqual([]);
  });
});
