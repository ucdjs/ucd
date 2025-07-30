import type { UnicodeTree } from "@ucdjs/fetch";
import { HttpResponse, mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { client } from "@ucdjs/fetch";
import { describe, expect, it, vi } from "vitest";
import { UCDStoreError, UCDStoreVersionNotFoundError } from "../../src/errors";
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
            path: "/ucd/",
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
      "/15.0.0/ReadMe.txt",
      "/15.0.0/UnicodeData.txt",
      "/15.0.0/ucd/emoji-data.txt",
    ]);
  });

  // it("should throw UCDStoreVersionNotFoundError for unavailable version", async () => {
  //   const version = "99.0.0";
  //   const availableVersions = ["14.0.0", "15.0.0", "16.0.0"];

  //   await expect(
  //     getExpectedFilePaths(mockClient, version, availableVersions),
  //   ).rejects.toThrow(UCDStoreVersionNotFoundError);

  //   expect(mockClient.GET).not.toHaveBeenCalled();
  // });

  // it("should throw UCDStoreError when API returns error", async () => {
  //   const version = "15.0.0";
  //   const availableVersions = ["14.0.0", "15.0.0", "16.0.0"];
  //   const mockError = { message: "API endpoint not found" };

  //   mockClient.GET.mockResolvedValue({
  //     data: null,
  //     error: mockError,
  //   });
  //   vi.mocked(isApiError).mockReturnValue(true);

  //   await expect(
  //     getExpectedFilePaths(mockClient, version, availableVersions),
  //   ).rejects.toThrow(UCDStoreError);
  //   await expect(
  //     getExpectedFilePaths(mockClient, version, availableVersions),
  //   ).rejects.toThrow("Failed to fetch expected files for version '15.0.0': API endpoint not found");
  // });

  // it("should handle empty file tree", async () => {
  //   const version = "15.0.0";
  //   const availableVersions = ["15.0.0"];
  //   const mockFileTree = {};
  //   const expectedPaths: string[] = [];

  //   mockClient.GET.mockResolvedValue({
  //     data: mockFileTree,
  //     error: null,
  //   });
  //   vi.mocked(isApiError).mockReturnValue(false);
  //   vi.mocked(flattenFilePaths).mockReturnValue(expectedPaths);

  //   const result = await getExpectedFilePaths(mockClient, version, availableVersions);

  //   expect(result).toEqual([]);
  //   expect(flattenFilePaths).toHaveBeenCalledWith(mockFileTree, "/15.0.0");
  // });

  // it("should handle version with special characters", async () => {
  //   const version = "15.0.0-beta";
  //   const availableVersions = ["15.0.0-beta"];
  //   const mockFileTree = { files: ["test.txt"] };
  //   const expectedPaths = ["/15.0.0-beta/test.txt"];

  //   mockClient.GET.mockResolvedValue({
  //     data: mockFileTree,
  //     error: null,
  //   });
  //   vi.mocked(isApiError).mockReturnValue(false);
  //   vi.mocked(flattenFilePaths).mockReturnValue(expectedPaths);

  //   const result = await getExpectedFilePaths(mockClient, version, availableVersions);

  //   expect(mockClient.GET).toHaveBeenCalledWith("/api/v1/versions/{version}/file-tree", {
  //     params: {
  //       path: {
  //         version: "15.0.0-beta",
  //       },
  //     },
  //   });
  //   expect(result).toEqual(expectedPaths);
  // });
});
