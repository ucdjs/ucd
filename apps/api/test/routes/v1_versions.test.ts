import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import worker from "../../src";

// mock the unicode-utils-new module
vi.mock("@luxass/unicode-utils-new", () => ({
  getCurrentDraftVersion: vi.fn(),
  resolveUCDVersion: vi.fn(),
}));

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
  vi.clearAllMocks();
});

describe("v1_versions", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/versions", () => {
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
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => {
        // Mock the UCD version mapping
        if (version === "16.0.0") return "16.0.0";
        if (version === "15.1.0") return "15.1.0";
        if (version === "15.0.0") return "15.0.0";
        return version;
      });

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json() as Array<{
        version: string;
        documentationUrl: string;
        date: string | null;
        url: string;
        mappedUcdVersion: string | null;
        status: string;
      }>;

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);

      // Check the structure of the first version (should be newest - 16.0.0)
      expect(data[0]).toMatchObject({
        version: "16.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null, // Same as version, so should be null
        status: "stable",
      });
    });

    it("should handle draft versions correctly", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue("17.0.0");
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => {
        if (version === "17.0.0") return "17.0.0";
        return version;
      });

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json() as Array<{
        version: string;
        status: string;
        date: string | null;
        mappedUcdVersion: string | null;
      }>;

      // Should include the draft version
      const draftVersion = data.find((v) => v.status === "draft");
      expect(draftVersion).toBeDefined();
      expect(draftVersion?.version).toBe("17.0.0");
      expect(draftVersion?.date).toBe(null);
      expect(draftVersion?.mappedUcdVersion).toBe(null);
    });

    it("should handle different UCD version mappings", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => {
        // Mock scenario where some versions have different UCD mappings
        if (version === "16.0.0") return "16.0.0";
        if (version === "15.1.0") return "15.1.0";
        if (version === "15.0.0") return "15.0.0-Update1"; // Different mapping
        return version;
      });

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json() as Array<{
        version: string;
        mappedUcdVersion: string | null;
      }>;

      // Find the version with different mapping
      const versionWithDifferentMapping = data.find((v) => v.version === "15.0.0");
      expect(versionWithDifferentMapping?.mappedUcdVersion).toBe("15.0.0-Update1");

      // Find versions with same mapping (should be null)
      const versionWithSameMapping = data.find((v) => v.version === "16.0.0");
      expect(versionWithSameMapping?.mappedUcdVersion).toBe(null);
    });

    it("should handle errors when fetching unicode.org fails", async () => {
      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(500, "Internal Server Error");

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Failed to fetch Unicode versions");
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle malformed HTML response", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => version);

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, "<html><body><p>No table here</p></body></html>");

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "Unicode versions table not found");
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle empty table response", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => version);

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

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, emptyTableHtml);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");

      const error = await response.json();
      expect(error).toHaveProperty("message", "No Unicode versions found");
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle getCurrentDraftVersion throwing error", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockRejectedValue(new Error("Draft version fetch failed"));
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => version);

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json() as Array<{
        version: string;
        status: string;
      }>;

      // Should still work without draft version
      expect(data.every((v) => v.status === "stable")).toBe(true);
    });

    it("should set proper cache headers", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => version);

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      // Check that cache headers are set (from the cache middleware)
      expect(response.headers.get("cache-control")).toBeTruthy();
    });

    it("should sort versions correctly (newest first)", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => version);

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mockHtmlResponse);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json() as Array<{
        version: string;
      }>;

      expect(data[0]!.version).toBe("16.0.0");
      expect(data[1]!.version).toBe("15.1.0");
      expect(data[2]!.version).toBe("15.0.0");
    });

    it("should handle versions with mixed year formats", async () => {
      const { getCurrentDraftVersion, resolveUCDVersion } = await import("@luxass/unicode-utils-new");

      vi.mocked(getCurrentDraftVersion).mockResolvedValue(null);
      vi.mocked(resolveUCDVersion).mockImplementation((version: string) => version);

      const mixedYearHtml = `
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
      `;

      fetchMock.get("https://www.unicode.org")
        .intercept({ path: "/versions/enumeratedversions.html" })
        .reply(200, mixedYearHtml);

      const request = new Request("https://api.ucdjs.dev/api/v1/versions");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json() as Array<{
        version: string;
        date: string | null;
      }>;

      // Should only include versions with valid year patterns
      expect(data).toHaveLength(1);
      expect(data[0]!.version).toBe("16.0.0");
      expect(data[0]!.date).toBe("2024");
    });
  });

  describe("route not found", () => {
    it("should return 404 for non-existent routes", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/versions/nonexistent");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });
  });
});
