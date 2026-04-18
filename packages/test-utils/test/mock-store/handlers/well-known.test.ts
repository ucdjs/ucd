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
          manifest: "/api/v1/versions/{version}/manifest",
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
          reports: "/custom/reports",
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
