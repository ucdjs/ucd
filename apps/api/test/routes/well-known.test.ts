import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";

import { afterEach, assert, beforeAll, describe, expect, it, vi } from "vitest";
import worker from "../../src/worker";

// Mock unicode-utils for version fetching
vi.mock("@unicode-utils/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@unicode-utils/core")>();

  return {
    ...original,
    getCurrentDraftVersion: vi.fn(() => Promise.resolve(null)),
    resolveUCDVersion: vi.fn((version: string) => version),
  };
});

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
  vi.resetAllMocks();
});

describe("well-known", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /ucd-config.json", () => {
    const mockHtmlResponse = `
      <html>
        <body>
          <table>
            <tr>
              <td><a href="https://www.unicode.org/versions/Unicode16.0.0/">Unicode 16.0.0</a></td>
              <td>2024</td>
            </tr>
            <tr>
              <td><a href="https://www.unicode.org/versions/Unicode15.1.0/">Unicode 15.1.0</a></td>
              <td>2023</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    it("should return UCD config successfully with versions array", async () => {
      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/.well-known/ucd-config.json");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect.soft(response.headers.get("content-type")).toBe("application/json");
      expect.soft(response.headers.get("cache-control")).toMatch(/max-age=\d+/);

      const json = await response.json();

      const result = UCDWellKnownConfigSchema.safeParse(json);

      if (!result.success) {
        expect.fail("Response does not match UCDWellKnownConfigSchema");
      }

      expect(result.data.versions).toEqual(["16.0.0", "15.1.0"]);
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /ucd-store.json", () => {
    it("should return deprecated manifest with deprecation headers", async () => {
      // Mock bucket with manifest data
      const mockManifest = {
        "16.0.0": {
          expectedFiles: [
            "16.0.0/ucd/UnicodeData.txt",
            "16.0.0/ucd/PropList.txt",
          ],
        },
      };

      // Mock bucket.list to return version directories
      const mockList = vi.fn().mockResolvedValue({
        objects: [
          { key: "manifest/16.0.0/manifest.json" },
        ],
      });

      // Mock bucket.get to return manifest
      const mockGet = vi.fn().mockResolvedValue({
        json: async () => mockManifest["16.0.0"],
        uploaded: new Date("2024-01-01"),
      });

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          list: mockList,
          get: mockGet,
        } as any,
      };

      const request = new Request("https://api.ucdjs.dev/.well-known/ucd-store.json");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("Deprecation")).toBe("true");
      expect(response.headers.get("Sunset")).toBeTruthy();
      expect(response.headers.get("Link")).toContain("ucd-store/{version}.json");
      expect(response.headers.get("Link")).toContain("successor-version");

      const json = await response.json();
      expect(json).toHaveProperty("16.0.0");
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /ucd-store/{version}.json", () => {
    it("should return manifest for specific version", async () => {
      const mockManifest = {
        expectedFiles: [
          "16.0.0/ucd/UnicodeData.txt",
          "16.0.0/ucd/PropList.txt",
        ],
      };

      const mockGet = vi.fn().mockResolvedValue({
        json: async () => mockManifest,
        uploaded: new Date("2024-01-01"),
      });

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const request = new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json");
      expect(response.headers.get("cache-control")).toMatch(/max-age=\d+/);
      expect(response.headers.get("Last-Modified")).toBeTruthy();

      const json = await response.json();
      expect(json).toEqual(mockManifest);
      expect(mockGet).toHaveBeenCalledWith("manifest/16.0.0/manifest.json");
    });

    it("should return 404 for non-existent version", async () => {
      const mockGet = vi.fn().mockResolvedValue(null);

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const request = new Request("https://api.ucdjs.dev/.well-known/ucd-store/99.0.0.json");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("message");
    });

    it("should return 404 for invalid version format", async () => {
      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: vi.fn(),
        } as any,
      };

      const request = new Request("https://api.ucdjs.dev/.well-known/ucd-store/invalid.json");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, mockEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      const json = await response.json();

      assert(typeof json === "object" && json !== null && "message" in json);
      expect(json.message).toContain("Version parameter is required");
    });
  });
});
