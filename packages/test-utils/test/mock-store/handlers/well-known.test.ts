import { describe, expect, it } from "vitest";
import { mockStoreApi } from "../../../src/mock-store";

describe("handler: /.well-known/ucd-config.json", () => {
  describe("default response", () => {
    it("should return default config", async () => {
      mockStoreApi({
        responses: {
          "/.well-known/ucd-config.json": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-config.json",
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toMatchObject({
        version: "0.1",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store/{version}.json",
          versions: "/api/v1/versions",
        },
      });
    });
  });

  describe("custom response", () => {
    it("should accept custom config data", async () => {
      const customConfig = {
        version: "1.0",
        endpoints: {
          files: "/custom/files",
          manifest: "/custom/manifest",
          versions: "/custom/versions",
        },
        versions: [],
      };

      mockStoreApi({
        responses: {
          "/.well-known/ucd-config.json": customConfig,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-config.json",
      );
      const data = await response.json();

      expect(data).toEqual(customConfig);
    });
  });
});

describe("handler: /.well-known/ucd-store/{version}.json", () => {
  describe("default response", () => {
    it("should return default store manifest", async () => {
      mockStoreApi({
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json",
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("expectedFiles");
      expect(Array.isArray(data.expectedFiles)).toBe(true);
    });
  });

  describe("custom response", () => {
    it("should accept custom manifest data", async () => {
      const customManifest = {
        expectedFiles: ["/16.0.0/ucd/custom.txt"],
      };

      mockStoreApi({
        responses: {
          "/.well-known/ucd-store/{version}.json": customManifest,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json",
      );
      const data = await response.json();

      expect(data).toEqual(customManifest);
    });
  });

  describe("version validation", () => {
    it("should return 404 for non-existent version", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/.well-known/ucd-store/99.0.0.json",
      );
      expect(response.status).toBe(404);
    });
  });
});
