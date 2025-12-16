import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it } from "vitest";
import { discoverEndpointsFromConfig } from "../src/ucd-config";

describe("discoverEndpointsFromConfig", () => {
  describe("successful discovery", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
          } satisfies UCDWellKnownConfig);
        }],
      ]);
    });

    it("should fetch and return valid well-known config", async () => {
      const config = await discoverEndpointsFromConfig(UCDJS_API_BASE_URL);

      expect(config).toEqual({
        version: "0.1",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store.json",
          versions: "/api/v1/versions",
        },
      });
    });

    it("should apply default version when not provided", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
          });
        }],
      ]);

      const config = await discoverEndpointsFromConfig(UCDJS_API_BASE_URL);

      expect(config.version).toBe("1.0");
    });
  });

  describe("error handling", () => {
    it("should throw error when well-known config endpoint returns 404", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      await expect(discoverEndpointsFromConfig(UCDJS_API_BASE_URL)).rejects.toThrow();
    });

    it("should throw error when response is not valid JSON", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.text("invalid json");
        }],
      ]);

      await expect(discoverEndpointsFromConfig(UCDJS_API_BASE_URL)).rejects.toThrow();
    });

    it("should throw error when schema validation fails - missing endpoints", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            version: "0.1",
          });
        }],
      ]);

      await expect(discoverEndpointsFromConfig(UCDJS_API_BASE_URL)).rejects.toThrow(
        /Invalid well-known config/,
      );
    });

    it("should throw error when schema validation fails - missing required endpoint fields", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
            },
          });
        }],
      ]);

      await expect(discoverEndpointsFromConfig(UCDJS_API_BASE_URL)).rejects.toThrow(
        /Invalid well-known config/,
      );
    });

    it("should throw error when endpoints are not strings", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: 123,
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
          });
        }],
      ]);

      await expect(discoverEndpointsFromConfig(UCDJS_API_BASE_URL)).rejects.toThrow(
        /Invalid well-known config/,
      );
    });
  });

  describe("custom server configurations", () => {
    it("should handle custom endpoint paths", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: "/v2/files",
              manifest: "/v2/files/manifest.json",
              versions: "/v2/versions",
            },
          });
        }],
      ]);

      const config = await discoverEndpointsFromConfig(UCDJS_API_BASE_URL);

      expect(config.endpoints).toEqual({
        files: "/v2/files",
        manifest: "/v2/files/manifest.json",
        versions: "/v2/versions",
      });
    });

    it("should work with different base URLs", async () => {
      const customBaseUrl = "https://ucd.luxass.dev";

      mockFetch([
        ["GET", `${customBaseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: "/api/files",
              manifest: "/api/manifest",
              versions: "/api/versions",
            },
          });
        }],
      ]);

      const config = await discoverEndpointsFromConfig(customBaseUrl);

      expect(config.endpoints.files).toBe("/api/files");
      expect(config.endpoints.manifest).toBe("/api/manifest");
      expect(config.endpoints.versions).toBe("/api/versions");
    });
  });
});
