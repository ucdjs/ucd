import type { UnicodeVersionList } from "@ucdjs/schemas";
import { HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { configure, mockStoreApi } from "../../../src/mock-store";

describe("handler: /api/v1/versions", () => {
  describe("default response", () => {
    it("should return default versions list", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": true,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveLength(3);
      expect(data[0]).toMatchObject({
        version: "16.0.0",
        type: "stable",
      });
    });

    it("should use custom versions in default response", async () => {
      mockStoreApi({
        versions: ["1.0.0", "2.0.0"],
        responses: {
          "/api/v1/versions": true,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].version).toBe("1.0.0");
      expect(data[1].version).toBe("2.0.0");
    });
  });

  describe("custom response", () => {
    it("should accept custom response data", async () => {
      const customData = [
        {
          version: "custom",
          documentationUrl: "https://unicode.org",
          date: null,
          url: "https://unicode.org",
          mappedUcdVersion: null,
          type: "draft" as const,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/versions": customData,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toEqual(customData);
    });

    it("should accept custom resolver function", async () => {
      const customVersion: UnicodeVersionList = [{
        version: "resolver",
        documentationUrl: "https://unicode.org",
        date: null,
        url: "https://unicode.org",
        mappedUcdVersion: null,
        type: "draft",
      }];

      mockStoreApi({
        responses: {
          "/api/v1/versions": vi.fn(async () => {
            return HttpResponse.json<UnicodeVersionList>(customVersion);
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const data = await response.json();

      expect(data).toEqual(customVersion);
    });
  });

  describe("disabled endpoint", () => {
    it("should skip endpoint when set to false", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": false,
        },
      });

      await expect(fetch("https://api.ucdjs.dev/api/v1/versions")).rejects.toThrow();
    });
  });

  describe("configure() options", () => {
    it("should handle configured response with latency", async () => {
      const testData: UnicodeVersionList = [];

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: testData,
            latency: 50,
          }),
        },
      });

      const start = Date.now();
      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("should handle configured response with headers", async () => {
      const testData: UnicodeVersionList = [];

      mockStoreApi({
        responses: {
          "/api/v1/versions": configure({
            response: testData,
            headers: {
              "X-Custom-Header": "test-value",
            },
          }),
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");

      expect(response.headers.get("X-Custom-Header")).toBe("test-value");
    });
  });
});
