import type { UnicodeTree } from "@ucdjs/schemas";
import { mockStoreApi } from "#test-utils/mock-store";
import { getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { getExpectedFilePaths } from "../../src/core/files";
import { UCDStoreGenericError } from "../../src/errors";

describe("getExpectedFilePaths", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should return flattened file paths for valid version", async () => {
    mockStoreApi({
      versions: ["15.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "ReadMe.txt",
            path: "ReadMe.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
          {
            type: "directory",
            name: "ucd",
            path: "ucd",
            lastModified: Date.now(),
            children: [
              {
                type: "file",
                name: "emoji-data.txt",
                path: "ucd/emoji-data.txt",
                lastModified: Date.now(),
              },
            ],
          },
        ] satisfies UnicodeTree,
      },
    });

    const result = await getExpectedFilePaths(client, "15.0.0");

    expect(result).toEqual([
      "ReadMe.txt",
      "UnicodeData.txt",
      "ucd/emoji-data.txt",
    ]);
  });

  it("should throw UCDStoreGenericError when API returns error", async () => {
    mockStoreApi({
      versions: ["15.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": {
          status: 404,
          message: "Version not found",
          timestamp: new Date().toISOString(),
        },
      },
    });

    await expect(
      getExpectedFilePaths(client, "15.0.0"),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should handle empty file tree", async () => {
    mockStoreApi({
      versions: ["15.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [],
      },
    });

    const result = await getExpectedFilePaths(client, "15.0.0");

    expect(result).toEqual([]);
  });
});
