import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createFilesResource } from "../../src/resources/files";

describe("createFilesResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;
  const endpoints = {
    files: "/api/v1/files",
    manifest: "/.well-known/ucd-store.json",
    versions: "/api/v1/versions",
  };

  const mockManifest = {
    version: "1.0",
    files: [
      { path: "16.0.0/ucd/UnicodeData.txt", size: 1024 },
      { path: "16.0.0/ucd/PropList.txt", size: 2048 },
    ],
  };

  describe("get()", () => {
    it("should fetch file content as text successfully", async () => {
      const fileContent = "# Unicode Data File\n0000;NULL;...";

      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });

    it("should fetch directory listing as JSON successfully", async () => {
      const directoryListing = [
        { type: "file", name: "UnicodeData.txt", path: "/16.0.0/ucd/UnicodeData.txt" },
        { type: "file", name: "PropList.txt", path: "/16.0.0/ucd/PropList.txt" },
      ];

      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd`, () => {
          return HttpResponse.json(directoryListing);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd");

      expect(error).toBeNull();
      expect(data).toEqual(directoryListing);
      expect(Array.isArray(data)).toBe(true);
    });

    it.each([
      "16.0.0/ucd/UnicodeData.txt",
      "15.1.0/ucd/emoji/emoji-data.txt",
      "latest/ucd/PropList.txt",
    ])("should handle file fetching for path %s", async (path) => {
      mockFetch([
        [
          "GET",
          `${baseUrl}${endpoints.files}/${path}`,
          () => HttpResponse.text(`Content of ${path}`),
        ],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get(path);

      expect(error).toBeNull();
      expect(data).toBe(`Content of ${path}`);
    });

    it("should handle 404 errors for non-existent files", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/99.0.0/ucd/NonExistent.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("99.0.0/ucd/NonExistent.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.error();
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("getManifest()", () => {
    it("should fetch the UCD manifest successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.manifest}`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.getManifest();

      expect(error).toBeNull();
      expect(data).toEqual(mockManifest);
    });

    it("should return manifest with correct structure", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.manifest}`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.getManifest();

      expect(error).toBeNull();
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("files");
      expect(Array.isArray(data!.files)).toBe(true);
    });

    it("should handle 404 errors for missing manifest", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.manifest}`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.getManifest();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.manifest}`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.getManifest();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });
  });

  describe("custom configuration", () => {
    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";
      const fileContent = "Custom server content";

      mockFetch([
        ["GET", `${customBaseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({
        baseUrl: customBaseUrl,
        endpoints,
      });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });

    it("should work with custom files paths", async () => {
      const customFilesPath = "/v2/files";
      const fileContent = "Custom path content";

      mockFetch([
        ["GET", `${baseUrl}${customFilesPath}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({
        baseUrl,
        endpoints: {
          ...endpoints,
          files: customFilesPath,
        },
      });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });

    it("should work with custom manifest paths", async () => {
      const customManifestPath = "/v2/manifest.json";

      mockFetch([
        ["GET", `${baseUrl}${customManifestPath}`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const filesResource = createFilesResource({
        baseUrl,
        endpoints: {
          ...endpoints,
          manifest: customManifestPath,
        },
      });

      const { data, error } = await filesResource.getManifest();

      expect(error).toBeNull();
      expect(data).toEqual(mockManifest);
    });
  });
});
