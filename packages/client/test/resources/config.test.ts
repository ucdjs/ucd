import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createConfigResource } from "../../src/resources/config";

describe("createConfigResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;

  const mockConfig: UCDWellKnownConfig = {
    version: "0.1",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/.well-known/ucd-store.json",
      versions: "/api/v1/versions",
    },
    versions: ["17.0.0", "16.0.0", "15.1.0"],
  };

  describe("get()", () => {
    it("should fetch config successfully", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockConfig);
        }],
      ]);

      const configResource = createConfigResource({ baseUrl });
      const { data, error } = await configResource.get();

      expect(error).toBeNull();
      expect(data).toEqual(mockConfig);
    });

    it("should return config with correct structure", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockConfig);
        }],
      ]);

      const configResource = createConfigResource({ baseUrl });
      const { data, error } = await configResource.get();

      expect(error).toBeNull();
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("endpoints");
      expect(data!.endpoints).toHaveProperty("files");
      expect(data!.endpoints).toHaveProperty("manifest");
      expect(data!.endpoints).toHaveProperty("versions");
      expect(data).toHaveProperty("versions");
      expect(Array.isArray(data!.versions)).toBe(true);
    });

    it("should handle config without versions array", async () => {
      const configWithoutVersions: UCDWellKnownConfig = {
        version: "0.1",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store.json",
          versions: "/api/v1/versions",
        },
      };

      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(configWithoutVersions);
        }],
      ]);

      const configResource = createConfigResource({ baseUrl });
      const { data, error } = await configResource.get();

      expect(error).toBeNull();
      expect(data).toEqual(configWithoutVersions);
    });

    it("should handle 404 errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const configResource = createConfigResource({ baseUrl });
      const { data, error } = await configResource.get();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const configResource = createConfigResource({ baseUrl });
      const { data, error } = await configResource.get();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.error();
        }],
      ]);

      const configResource = createConfigResource({ baseUrl });
      const { data, error } = await configResource.get();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("custom configuration", () => {
    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";

      mockFetch([
        ["GET", `${customBaseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockConfig);
        }],
      ]);

      const configResource = createConfigResource({ baseUrl: customBaseUrl });
      const { data, error } = await configResource.get();

      expect(error).toBeNull();
      expect(data).toEqual(mockConfig);
    });
  });
});
