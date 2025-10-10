import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockStoreApi } from "../src/mock-store";

describe("mockStoreApi", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("basic setup", () => {
    it("should set up default handlers when called with no config", async () => {
      mockStoreApi();

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should set up handlers with custom config", async () => {
      mockStoreApi({
        baseUrl: "https://custom.api.com",
        versions: ["14.0.0"],
      });

      const response = await fetch("https://custom.api.com/api/v1/versions");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should normalize baseUrl by removing trailing slash", async () => {
      mockStoreApi({
        baseUrl: "https://api.example.com/",
      });

      const response = await fetch("https://api.example.com/api/v1/versions");
      expect(response.ok).toBe(true);
    });
  });

  describe("version configuration", () => {
    it("should use default versions when none provided", async () => {
      mockStoreApi();

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.length).toBeGreaterThan(0);
    });

    it("should use custom versions when provided", async () => {
      mockStoreApi({
        versions: ["13.0.0", "12.1.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe("response configuration", () => {
    it("should enable all default endpoints when no responses config provided", async () => {
      mockStoreApi();

      const versionsResponse = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(versionsResponse.ok).toBe(true);

      const manifestResponse = await fetch("https://api.ucdjs.dev/api/v1/files/.ucd-store.json");
      expect(manifestResponse.ok).toBe(true);
    });

    it("should disable endpoints when responses is set to false", async () => {
      try {
        mockStoreApi({
          responses: {
            "/api/v1/versions": false,
          },
        });

        const res = await fetch("https://api.ucdjs.dev/api/v1/versions");
        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);

        expect.fail(
          "mockStoreApi should have thrown an error, since /versions mocked is disabled\n"
          + "And MSW should throw have blocked it",
        );
      } catch (err) {
        const msg = (err as Error).message;
        expect(msg).toBe("[MSW] Cannot bypass a request when using the \"error\" strategy for the \"onUnhandledRequest\" option.");
      }
    });

    it("should accept custom response data", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": [
            {
              version: "15.0.0",
              documentationUrl: "https://example.com",
              date: null,
              url: "https://example.com",
              mappedUcdVersion: null,
              type: "stable",
            },
          ],
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual([
        {
          version: "15.0.0",
          documentationUrl: "https://example.com",
          date: null,
          url: "https://example.com",
          mappedUcdVersion: null,
          type: "stable",
        },
      ]);
    });

    it("should accept custom manifest response", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/.ucd-store.json": {
            "15.0.0": "15.0.0",
            "14.0.0": "14.0.0",
          },
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/.ucd-store.json");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual({
        "15.0.0": "15.0.0",
        "14.0.0": "14.0.0",
      });
    });

    it("should accept true for default responses", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/:version/file-tree": true,
          "/api/v1/files/.ucd-store.json": true,
          "/api/v1/files/:wildcard": true,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
    });
  });

  describe("mixed configuration", () => {
    it("should handle mix of enabled and disabled endpoints", () => {
      expect(() => mockStoreApi({
        responses: {
          "/api/v1/versions": true,
          "/api/v1/versions/:version/file-tree": false,
          "/api/v1/files/.ucd-store.json": {
            "15.0.0": "15.0.0",
          },
          "/api/v1/files/:wildcard": true,
        },
      })).not.toThrow();
    });

    it("should handle custom baseUrl with custom responses", () => {
      expect(() => mockStoreApi({
        baseUrl: "https://custom.api.com",
        versions: ["14.0.0", "13.0.0"],
        responses: {
          "/api/v1/versions": true,
          "/api/v1/files/.ucd-store.json": {
            "14.0.0": "14.0.0",
            "13.0.0": "13.0.0",
          },
        },
      })).not.toThrow();
    });
  });

  describe("endpoint handlers", () => {
    it("should set up versions endpoint when enabled", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions": true,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions");
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should set up file-tree endpoint when enabled", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions/:version/file-tree": true,
        },
        versions: ["15.0.0"],
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/versions/15.0.0/file-tree");
      expect(response.ok).toBe(true);
    });

    it("should set up files endpoint when enabled", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/:wildcard": true,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/test.txt");
      expect(response.ok).toBe(true);
    });

    it("should set up manifest endpoint when enabled", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/.ucd-store.json": true,
        },
      });

      const response = await fetch("https://api.ucdjs.dev/api/v1/files/.ucd-store.json");
      expect(response.ok).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty versions array", () => {
      expect(() => mockStoreApi({
        versions: [],
      })).not.toThrow();
    });

    it("should handle empty responses object", () => {
      expect(() => mockStoreApi({
        responses: {},
      })).not.toThrow();
    });

    it("should handle baseUrl without protocol", () => {
      expect(() => mockStoreApi({
        baseUrl: "api.example.com",
      })).not.toThrow();
    });
  });
});
