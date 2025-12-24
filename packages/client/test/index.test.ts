import type { UnicodeVersionList } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createUCDClient, createUCDClientWithConfig } from "../src";

const mockVersionsList: UnicodeVersionList = [
  {
    version: "16.0.0",
    documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
    date: "2024",
    url: "https://www.unicode.org/Public/16.0.0/ucd/",
    type: "stable",
    mappedUcdVersion: null,
  },
  {
    version: "15.1.0",
    documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
    date: "2023",
    url: "https://www.unicode.org/Public/15.1.0/ucd/",
    type: "stable",
    mappedUcdVersion: null,
  },
];

describe("ucd client", () => {
  describe("createUCDClient (async version)", () => {
    const mockWellKnownConfig = {
      version: "1.0",
      endpoints: {
        files: "/api/v1/files",
        manifest: "/.well-known/ucd-store.json",
        versions: "/api/v1/versions",
      },
    };

    it("should create a client instance by discovering endpoints", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockWellKnownConfig);
        }],
      ]);

      const client = await createUCDClient(UCDJS_API_BASE_URL);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();
      expect(client.config).toBeDefined();
      expect(client.manifest).toBeDefined();
      expect(client.files).toHaveProperty("get");
      expect(client.versions).toHaveProperty("list");
      expect(client.config).toHaveProperty("get");
      expect(client.manifest).toHaveProperty("get");
    });

    it("should throw an error when well-known config is not found", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      await expect(createUCDClient(UCDJS_API_BASE_URL)).rejects.toThrow();
    });

    it("should throw an error on invalid well-known config", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({ invalid: "config" });
        }],
      ]);

      await expect(createUCDClient(UCDJS_API_BASE_URL)).rejects.toThrow("Invalid well-known config");
    });

    it("should create a client instance and call the versions endpoint", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockWellKnownConfig);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const client = await createUCDClient(UCDJS_API_BASE_URL);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();

      const { data: versions, error } = await client.versions.list();

      expect(error).toBeNull();
      expect(versions).toEqual(mockVersionsList);
    });
  });

  describe("createUCDClientWithConfig (sync version)", () => {
    it("should create a client instance using the provided endpoint config", () => {
      const providedConfig = {
        version: "1.0",
        endpoints: {
          files: "/custom/files",
          manifest: "/custom/files/manifest.json",
          versions: "/custom/versions",
        },
        versions: ["16.0.0"],
      };

      const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, providedConfig);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();
      expect(client.config).toBeDefined();
      expect(client.manifest).toBeDefined();
      expect(client.files).toHaveProperty("get");
      expect(client.versions).toHaveProperty("list");
      expect(client.config).toHaveProperty("get");
      expect(client.manifest).toHaveProperty("get");
    });

    it("should handle custom base URLs correctly", () => {
      const customBaseUrl = "https://custom-ucd-server.com";
      const providedConfig = {
        version: "1.0",
        endpoints: {
          files: "/custom/files",
          manifest: "/custom/files/manifest.json",
          versions: "/custom/versions",
        },
        versions: ["16.0.0"],
      };

      const client = createUCDClientWithConfig(customBaseUrl, providedConfig);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();
      expect(client.config).toBeDefined();
      expect(client.manifest).toBeDefined();
      expect(client.files).toHaveProperty("get");
      expect(client.versions).toHaveProperty("list");
      expect(client.config).toHaveProperty("get");
      expect(client.manifest).toHaveProperty("get");
    });

    it("should create a client instance and call the versions endpoint", async () => {
      const providedConfig = {
        version: "1.0",
        endpoints: {
          files: "/custom/files",
          manifest: "/custom/files/manifest.json",
          versions: "/custom/versions",
        },
        versions: ["16.0.0", "15.1.0"],
      };

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/custom/versions`, () => {
          return HttpResponse.json(mockVersionsList);
        }],
      ]);

      const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, providedConfig);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();

      const { data: versions, error } = await client.versions.list();

      expect(error).toBeNull();
      expect(versions).toEqual(mockVersionsList);
    });
  });
});
