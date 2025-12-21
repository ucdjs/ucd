import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createManifestResource } from "../../src/resources/manifest";

describe("createManifestResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;

  const mockManifest = {
    expectedFiles: [
      "16.0.0/ucd/UnicodeData.txt",
      "16.0.0/ucd/PropList.txt",
      "16.0.0/ucd/emoji/emoji-data.txt",
    ],
  };

  describe("get()", () => {
    it("should fetch manifest for valid version successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-store/{version}.json`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get("16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(mockManifest);
    });

    it("should return manifest with correct structure", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-store/{version}.json`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get("16.0.0");

      expect(error).toBeNull();
      expect(data).toHaveProperty("expectedFiles");
      expect(Array.isArray(data!.expectedFiles)).toBe(true);
      expect(data!.expectedFiles.length).toBeGreaterThan(0);
    });

    it.each([
      "15.1.0",
      "15.0.0",
      "17.0.0",
    ])("should handle manifest fetching for version %s", async (version) => {
      const versionManifest = {
        expectedFiles: [`${version}/ucd/UnicodeData.txt`],
      };

      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-store/${version}.json`, () => {
          return HttpResponse.json(versionManifest);
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get(version);

      expect(error).toBeNull();
      expect(data).toEqual(versionManifest);
    });

    it("should handle 404 errors for non-existent version", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-store/99.0.0.json`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get("99.0.0");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 404);
    });

    it.each([
      "16",
      "16.0",
      "v16.0.0",
      "16.0.0.0",
      "latest",
    ])("should handle invalid version format %s", async (version) => {
      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get(version);

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toContain("Invalid version format");
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-store/{version}.json`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get("16.0.0");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-store/{version}.json`, () => {
          return HttpResponse.error();
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl });
      const { data, error } = await manifestResource.get("16.0.0");

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("custom configuration", () => {
    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";

      mockFetch([
        ["GET", `${customBaseUrl}/.well-known/ucd-store/{version}.json`, () => {
          return HttpResponse.json(mockManifest);
        }],
      ]);

      const manifestResource = createManifestResource({ baseUrl: customBaseUrl });
      const { data, error } = await manifestResource.get("16.0.0");

      expect(error).toBeNull();
      expect(data).toEqual(mockManifest);
    });
  });
});
