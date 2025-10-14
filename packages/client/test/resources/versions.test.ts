import type { UnicodeVersionList } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createVersionsResource } from "../../src/resources/versions";

describe("createVersionsResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;
  const endpoints = {
    files: "/api/v1/files",
    manifest: "/api/v1/files/.ucd-store.json",
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
      const result = await versionsResource.list();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockVersionsList);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should return versions with correct structure", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const result = await versionsResource.list();

      expect(result.error).toBeUndefined();
      expect(result.data![0]).toHaveProperty("version");
      expect(result.data![0]).toHaveProperty("documentationUrl");
      expect(result.data![0]).toHaveProperty("date");
      expect(result.data![0]).toHaveProperty("url");
      expect(result.data![0]).toHaveProperty("type");
    });

    it("should handle errors gracefully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const result = await versionsResource.list();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}`, () => {
          return HttpResponse.error();
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const result = await versionsResource.list();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
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
      const result = await versionsResource.getFileTree("16.0.0");

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockFileTree);
    });

    it("should handle different version numbers", async () => {
      const versions = ["15.1.0", "15.0.0", "14.0.0"];

      for (const version of versions) {
        mockFetch([
          ["GET", `${baseUrl}${endpoints.versions}/${version}/file-tree`, () => {
            return HttpResponse.json({ ...mockFileTree, version });
          }],
        ]);
      }

      const versionsResource = createVersionsResource({ baseUrl, endpoints });

      for (const version of versions) {
        const result = await versionsResource.getFileTree(version);
        expect(result.error).toBeUndefined();
        expect(result.data).toHaveProperty("version", version);
      }
    });

    it("should handle 404 errors for non-existent versions", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}/99.0.0/file-tree`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const result = await versionsResource.getFileTree("99.0.0");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.versions}/16.0.0/file-tree`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const versionsResource = createVersionsResource({ baseUrl, endpoints });
      const result = await versionsResource.getFileTree("16.0.0");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 500);
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
      const result = await versionsResource.list();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockVersionsList);
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
      const result = await versionsResource.list();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockVersionsList);
    });
  });
});
