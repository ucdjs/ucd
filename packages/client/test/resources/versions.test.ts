import type { UnicodeVersionList } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createVersionsResource } from "../../src/resources/versions";

describe("createVersionsResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;
  const endpoints = {
    files: "/api/v1/files",
    manifest: "/.well-known/ucd-store.json",
    versions: "/api/v1/versions",
  };

  const mockVersionsList = [
    {
      version: "16.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
      date: "2024-09-10",
      url: "https://www.unicode.org/Public/16.0.0/ucd/",
      type: "stable",
      mappedUcdVersion: "16.0.0",
    },
    {
      version: "15.1.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
      date: "2023-09-12",
      url: "https://www.unicode.org/Public/15.1.0/ucd/",
      type: "stable",
      mappedUcdVersion: "15.1.0",
    },
  ] satisfies UnicodeVersionList;

  const mockFileTree = {
    name: "ucd",
    type: "directory",
    children: [
      { name: "UnicodeData.txt", type: "file" },
      { name: "PropList.txt", type: "file" },
    ],
  };

  describe("list()", () => {
    it("should fetch all Unicode versions successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.list();

      expect(error).toBeNull();
      expect(data).toEqual(mockVersionsList);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it("should return versions with correct structure", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.list();

      expect(error).toBeNull();
      expect(data![0]).toHaveProperty("version");
      expect(data![0]).toHaveProperty("documentationUrl");
      expect(data![0]).toHaveProperty("date");
      expect(data![0]).toHaveProperty("url");
      expect(data![0]).toHaveProperty("type");
    });

    it("should handle errors gracefully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.list();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return HttpResponse.error();
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.list();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("getFileTree()", () => {
    it("should fetch file tree for a version successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}/16.0.0/file-tree`, () => {
          return HttpResponse.json(mockFileTree);
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.getFileTree("16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(mockFileTree);
    });

    it.each(
      ["15.1.0", "15.0.0", "14.0.0"],
    )("should handle file tree fetching for version %s", async (version) => {
      mockFetch([
        [
          "GET",
          `${baseUrl}${endpoints.versions}/${version}/file-tree`,
          () => HttpResponse.json({ ...mockFileTree, version }),
        ],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.getFileTree(version);

      expect(error).toBeNull();
      expect(data).toHaveProperty("version", version);
    });

    it("should handle 404 errors for non-existent versions", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}/99.0.0/file-tree`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.getFileTree("99.0.0");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}/16.0.0/file-tree`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const { data, error } = await versionsResource.getFileTree("16.0.0");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });
  });

  describe("custom configuration", () => {
    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";

      mockFetch([
        ["GET", `${customBaseUrl}${endpoints.versions}`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const versionsResource = createVersionsResource({
        baseUrl: customBaseUrl,
        endpoints,
      });
      const { data, error } = await versionsResource.list();

      expect(error).toBeNull();
      expect(data).toEqual(mockVersionsList);
    });

    it("should work with custom versions paths", async () => {
      const customVersionsPath = "/v2/versions";

      mockFetch([
        ["GET", `${baseUrl}${customVersionsPath}`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const versionsResource = createVersionsResource({
        baseUrl,
        endpoints: {
          ...endpoints,
          versions: customVersionsPath,
        },
      });
      const { data, error } = await versionsResource.list();

      expect(error).toBeNull();
      expect(data).toEqual(mockVersionsList);
    });
  });
});
