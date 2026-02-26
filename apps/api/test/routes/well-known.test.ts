import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";
import {
  expectApiError,
  expectCacheHeaders,
  expectJsonResponse,
  expectSuccess,
} from "../helpers/response";

vi.mock("@unicode-utils/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@unicode-utils/core")>();

  return {
    ...original,
    getCurrentDraftVersion: vi.fn((...args) => original.getCurrentDraftVersion(...args)),
    resolveUCDVersion: vi.fn((version) => original.resolveUCDVersion(version)),
  };
});

afterEach(() => {
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
      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
        ["GET", "https://unicode.org/Public/draft/ReadMe.txt", () => {
          return HttpResponse.text("");
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-config.json"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);
      expectCacheHeaders(response);

      const data = await json();

      expect(data).toMatchSchema({
        success: true,
        schema: UCDWellKnownConfigSchema,
        data: {
          versions: ["16.0.0", "15.1.0"],
        },
      });
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
        httpEtag: "\"abc123etag\"",
      });

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json"),
        mockEnv,
      );

      expectSuccess(response);
      expectJsonResponse(response);
      expectCacheHeaders(response);
      expect(response.headers.get("Last-Modified")).toBeTruthy();
      expect(response.headers.get("ETag")).toBe("\"abc123etag\"");

      const data = await json();
      expect(data).toEqual(mockManifest);
      expect(mockGet).toHaveBeenCalledWith("manifest/16.0.0/manifest.json");
    });

    it("should return matching ETag for HEAD and GET", async () => {
      const mockManifest = {
        expectedFiles: [
          "16.0.0/ucd/UnicodeData.txt",
          "16.0.0/ucd/PropList.txt",
        ],
      };

      const mockGet = vi.fn().mockResolvedValue({
        json: async () => mockManifest,
        uploaded: new Date("2024-01-01"),
        httpEtag: "\"same-etag\"",
      });

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const { response: getResponse } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json"),
        mockEnv,
      );

      const { response: headResponse, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json", {
          method: "HEAD",
        }),
        mockEnv,
      );

      expectSuccess(getResponse);
      expectSuccess(headResponse);

      const getEtag = getResponse.headers.get("ETag");
      const headEtag = headResponse.headers.get("ETag");
      expect(getEtag).toBeTruthy();
      expect(headEtag).toBe(getEtag);

      expect(await text()).toBe("");
    });

    it("should return 404 for non-existent version", async () => {
      const mockGet = vi.fn().mockResolvedValue(null);

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/99.0.0.json"),
        mockEnv,
      );

      await expectApiError(response, { status: 404 });
    });

    it("should return 404 for invalid version format", async () => {
      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: vi.fn(),
        } as any,
      };

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/invalid.json"),
        mockEnv,
      );

      await expectApiError(response, {
        status: 404,
        message: /Invalid version format: invalid\. Expected format: X\.Y\.Z \(e\.g\., 16\.0\.0\)/,
      });
    });
  });
});
