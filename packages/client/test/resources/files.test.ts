import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createFilesResource } from "../../src/resources/files";

describe("createFilesResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;
  const filesPath = "/api/v1/files";
  const manifestPath = "/api/v1/files/.ucd-store.json";

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
        ["GET", `${baseUrl}${filesPath}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(result.error).toBeUndefined();
      expect(result.data).toBe(fileContent);
    });

    it("should fetch directory listing as JSON successfully", async () => {
      const directoryListing = [
        { type: "file", name: "UnicodeData.txt", path: "/16.0.0/ucd/UnicodeData.txt" },
        { type: "file", name: "PropList.txt", path: "/16.0.0/ucd/PropList.txt" },
      ];

      mockFetch([
        ["GET", `${baseUrl}${filesPath}/16.0.0/ucd`, () => {
          return HttpResponse.json(directoryListing);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.get("16.0.0/ucd");

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(directoryListing);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should handle different file paths", async () => {
      const paths = [
        "16.0.0/ucd/UnicodeData.txt",
        "15.1.0/ucd/emoji/emoji-data.txt",
        "latest/ucd/PropList.txt",
      ];

      for (const path of paths) {
        mockFetch([
          ["GET", `${baseUrl}${filesPath}/${path}`, () => {
            return HttpResponse.text(`Content of ${path}`);
          }],
        ]);
      }

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });

      for (const path of paths) {
        const result = await filesResource.get(path);
        expect(result.error).toBeUndefined();
        expect(result.data).toBe(`Content of ${path}`);
      }
    });

    it("should handle 404 errors for non-existent files", async () => {
      mockFetch([
        ["GET", `${baseUrl}${filesPath}/99.0.0/ucd/NonExistent.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.get("99.0.0/ucd/NonExistent.txt");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${filesPath}/16.0.0/ucd/UnicodeData.txt`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${filesPath}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.error();
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getManifest()", () => {
    it("should fetch the UCD manifest successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}${manifestPath}`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.getManifest();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockManifest);
    });

    it("should return manifest with correct structure", async () => {
      mockFetch([
        ["GET", `${baseUrl}${manifestPath}`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.getManifest();

      expect(result.error).toBeUndefined();
      expect(result.data).toHaveProperty("version");
      expect(result.data).toHaveProperty("files");
      expect(Array.isArray(result.data!.files)).toBe(true);
    });

    it("should handle 404 errors for missing manifest", async () => {
      mockFetch([
        ["GET", `${baseUrl}${manifestPath}`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.getManifest();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${manifestPath}`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, filesPath, manifestPath });
      const result = await filesResource.getManifest();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toHaveProperty("status", 500);
    });
  });

  describe("custom configuration", () => {
    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";
      const fileContent = "Custom server content";

      mockFetch([
        ["GET", `${customBaseUrl}${filesPath}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({
        baseUrl: customBaseUrl,
        filesPath,
        manifestPath,
      });
      const result = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(result.error).toBeUndefined();
      expect(result.data).toBe(fileContent);
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
        filesPath: customFilesPath,
        manifestPath,
      });
      const result = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(result.error).toBeUndefined();
      expect(result.data).toBe(fileContent);
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
        filesPath,
        manifestPath: customManifestPath,
      });
      const result = await filesResource.getManifest();

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockManifest);
    });
  });
});
