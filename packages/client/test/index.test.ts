import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createUCDClient } from "../src";

describe("createUCDClient", () => {
  const mockWellKnownConfig = {
    version: "1.0",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/api/v1/files/.ucd-store.json",
      versions: "/api/v1/versions",
    },
  };

  describe("client initialization", () => {
    it("should create a client instance", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockWellKnownConfig);
        }],
      ]);

      const client = await createUCDClient(UCDJS_API_BASE_URL);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();
    });

    it("should discover endpoints from well-known config", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockWellKnownConfig);
        }],
      ]);

      const client = await createUCDClient(UCDJS_API_BASE_URL);

      expect(client.versions).toHaveProperty("list");
      expect(client.versions).toHaveProperty("getFileTree");
      expect(client.files).toHaveProperty("get");
      expect(client.files).toHaveProperty("getManifest");
    });

    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";

      mockFetch([
        ["GET", `${customBaseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(mockWellKnownConfig);
        }],
      ]);

      const client = await createUCDClient(customBaseUrl);

      expect(client).toBeDefined();
      expect(client.files).toBeDefined();
      expect(client.versions).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should throw error when well-known config is not found", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      await expect(createUCDClient(UCDJS_API_BASE_URL)).rejects.toThrow();
    });

    it("should throw error on invalid well-known config", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({ invalid: "config" });
        }],
      ]);

      await expect(createUCDClient(UCDJS_API_BASE_URL)).rejects.toThrow("Invalid well-known config");
    });
  });

  describe("custom server configurations", () => {
    it("should work with custom endpoint paths", async () => {
      const customConfig = {
        version: "1.0",
        endpoints: {
          files: "/v2/files",
          manifest: "/v2/files/manifest.json",
          versions: "/v2/versions",
        },
      };

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(customConfig);
        }],
      ]);

      const client = await createUCDClient(UCDJS_API_BASE_URL);

      expect(client).toBeDefined();
      expect(client.versions).toHaveProperty("list");
      expect(client.files).toHaveProperty("get");
    });
  });
});
