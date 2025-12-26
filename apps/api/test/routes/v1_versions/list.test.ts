import type { UnicodeVersion } from "@ucdjs/schemas";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import * as UnicodeUtils from "@unicode-utils/core";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";
import {
  expectApiError,
  expectCacheHeaders,
  expectJsonResponse,
  expectSuccess,
} from "../../helpers/response";

vi.mock("@unicode-utils/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@unicode-utils/core")>();

  return {
    ...original,
    getCurrentDraftVersion: vi.fn().mockImplementation(() => {
      return original.getCurrentDraftVersion();
    }),
    resolveUCDVersion: vi.fn().mockImplementation((version) => {
      return original.resolveUCDVersion(version);
    }),
  };
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("v1_versions", () => {
  describe("gET /api/v1/versions", () => {
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
            <tr>
              <td><a href="https://www.unicode.org/versions/Unicode15.0.0/">Unicode 15.0.0</a></td>
              <td>2022</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    it("should return unicode versions with proper structure", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      expectJsonResponse(response);
      const data = await json() as UnicodeVersion[];

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);

      // Check the structure of the first version (should be newest - 16.0.0)
      expect(data[0]).toMatchObject({
        version: "16.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null, // Same as version, so should be null
        type: "stable",
      });
    });

    it("should handle draft versions correctly", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue("17.0.0");
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      const data = await json() as UnicodeVersion[];

      // Should include the draft version
      const draftVersion = data.find((v) => v.type === "draft");
      expect(draftVersion).toBeDefined();
      expect(draftVersion?.version).toBe("17.0.0");
      expect(draftVersion?.date).toBe(null);
      expect(draftVersion?.mappedUcdVersion).toBe(null);
    });

    it("should handle different UCD version mappings", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version: string) => {
      // Mock scenario where some versions have different UCD mappings
        if (version === "16.0.0") return "16.0.0";
        if (version === "15.1.0") return "15.1.0";
        if (version === "15.0.0") return "15.0.0-Update1"; // Different mapping
        return version;
      });

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      const data = await json() as UnicodeVersion[];

      // Find the version with different mapping
      const versionWithDifferentMapping = data.find((v) => v.version === "15.0.0");
      expect(versionWithDifferentMapping?.mappedUcdVersion).toBe("15.0.0-Update1");

      // Find versions with same mapping (should be null)
      const versionWithSameMapping = data.find((v) => v.version === "16.0.0");
      expect(versionWithSameMapping?.mappedUcdVersion).toBe(null);
    });

    it("should handle errors when fetching unicode.org fails", async () => {
      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text("Internal Server Error", { status: 500 });
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      await expectApiError(response, {
        status: 502,
        message: "Failed to fetch Unicode versions from upstream service",
      });
    });

    it("should handle malformed HTML response", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version: string) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text("<html><body><p>No table here</p></body></html>");
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      await expectApiError(response, {
        status: 502,
        message: "Failed to fetch Unicode versions from upstream service",
      });
    });

    it("should handle empty table response", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      const emptyTableHtml = `
        <html>
          <body>
            <table>
              <tr><th>Unicode 15.0.0</th></tr>
              <tr><td>No valid rows with year</td></tr>
            </table>
          </body>
        </html>
      `;

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(emptyTableHtml);
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      await expectApiError(response, {
        status: 502,
        message: "No Unicode versions found",
      });
    });

    it("should handle getCurrentDraftVersion throwing error", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockRejectedValue(new Error("Draft version fetch failed"));
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      const data = await json() as UnicodeVersion[];

      // Should still work without draft version
      expect(data.every((v) => v.type === "stable")).toBe(true);
    });

    it("should set proper cache headers", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
      ]);

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      expectCacheHeaders(response);
    });

    it("should sort versions correctly (newest first)", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(mockHtmlResponse);
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      const data = await json() as UnicodeVersion[];

      expect(data[0]!.version).toBe("16.0.0");
      expect(data[1]!.version).toBe("15.1.0");
      expect(data[2]!.version).toBe("15.0.0");
    });

    it("should handle versions with mixed year formats", async () => {
      vi.mocked(UnicodeUtils.getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(UnicodeUtils.resolveUCDVersion).mockImplementation((version) => version);

      mockFetch([
        ["GET", "https://www.unicode.org/versions/enumeratedversions.html", () => {
          return HttpResponse.text(`
            <html>
              <body>
                <table>
                  <tr>
                    <td><a href="https://www.unicode.org/versions/Unicode16.0.0/">Unicode 16.0.0</a></td>
                    <td>2024</td>
                  </tr>
                  <tr>
                    <td><a href="https://www.unicode.org/versions/Unicode15.1.0/">Unicode 15.1.0</a></td>
                    <td>some other text</td>
                  </tr>
                </table>
              </body>
            </html>
          `);
        }],
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expectSuccess(response);
      const data = await json() as UnicodeVersion[];

      // Should only include versions with valid year patterns
      expect(data).toHaveLength(1);
      expect(data[0]!.version).toBe("16.0.0");
      expect(data[0]!.date).toBe("2024");
    });
  });
});
