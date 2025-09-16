import type { UnicodeVersion } from "@ucdjs/schemas";
import type { Entry } from "apache-autoindex-parse";
import type { TraverseEntry } from "apache-autoindex-parse/traverse";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import z from "zod";
import worker from "../../src/worker";

// mock the unicode-utils-new module
vi.mock("@luxass/unicode-utils-new", async (importOriginal) => {
  const original = await importOriginal<typeof import("@luxass/unicode-utils-new")>();

  return {
    ...original,
    getCurrentDraftVersion: vi.fn(() => {
      return original.getCurrentDraftVersion();
    }),
    resolveUCDVersion: vi.fn((version) => {
      return original.resolveUCDVersion(version);
    }),
  };
});

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

beforeEach(() => {
  z.globalRegistry.clear();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
  vi.resetAllMocks();
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

      const data = await response.json() as UnicodeVersion[];

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
      const data = await response.json() as UnicodeVersion[];

      // Should include the draft version
      const draftVersion = data.find((v) => v.type === "draft");
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
      const data = await response.json() as UnicodeVersion[];

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
      const data = await response.json() as UnicodeVersion[];

      // Should still work without draft version
      expect(data.every((v) => v.type === "stable")).toBe(true);
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
      const data = await response.json() as UnicodeVersion[];

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
      const data = await response.json() as UnicodeVersion[];

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

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/versions/{version}/file-tree", () => {
    const files: TraverseEntry[] = [
      { type: "file", name: "file1.txt", path: "/Public/15.1.0/ucd/file1.txt" },
      { type: "file", name: "file2.txt", path: "/Public/15.1.0/ucd/file2.txt" },
      { type: "directory", name: "subdir", path: "/Public/15.1.0/ucd/subdir", children: [] },
      { type: "file", name: "file3.txt", path: "/Public/15.1.0/ucd/subdir/file3.txt" },
      { type: "file", name: "emoji-data.txt", path: "/Public/15.1.0/ucd/emoji/emoji-data.txt" },
    ];

    it("should return files for a valid Unicode version", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const request = new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json() as unknown[];
      expect(Array.isArray(data)).toBe(true);

      const expectedFiles = files.map((file) => {
        return expect.objectContaining({
          name: file.name,
          path: file.path,
          type: file.type,
          ...(file.type === "directory" ? { children: file.children } : {}),
        });
      });

      expect(data).toEqual(expect.arrayContaining(expectedFiles));
    });

    it("should return files for latest version", async () => {
      const request = new Request("https://api.ucdjs.dev/api/v1/versions/latest/file-tree");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return structured file data with proper schema", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/15.1.0/ucd" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const request = new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json() as TraverseEntry[];

      // validate the response structure
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const [filesEntries, directoryEntries] = data.reduce(
        ([files, directories], item) => {
          if (item.type === "file") {
            files.push(item);
          } else if (item.type === "directory") {
            directories.push(item);
          }

          return [files, directories];
        },
        [[], []] as [Entry[], TraverseEntry[]],
      );

      expect(filesEntries.length).toBeGreaterThan(0);
      expect(directoryEntries.length).toBeGreaterThan(0);

      // check that each file object has the required properties
      expect(filesEntries).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          path: expect.any(String),
          type: expect.any(String),
        }),
      ]));

      // check that each directory object has the required properties
      expect(directoryEntries).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          path: expect.any(String),
          type: expect.any(String),
          children: expect.any(Array),
        }),
      ]));
    });

    it("should handle older Unicode versions", async () => {
      fetchMock.get("https://unicode.org")
        .intercept({ path: "/Public/3.1-Update1" })
        .reply(200, generateAutoIndexHtml(files, "F2"));

      const request = new Request("https://api.ucdjs.dev/api/v1/versions/3.1.1/file-tree");
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    describe("error handling", () => {
      it("should return 400 for invalid Unicode version", async () => {
        const request = new Request("https://api.ucdjs.dev/api/v1/versions/99.99.99/file-tree");
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
        expect(response.headers.get("content-type")).toContain("application/json");

        const error = await response.json();
        expect(error).toHaveProperty("message", "Invalid Unicode version");
        expect(error).toHaveProperty("status", 400);
      });

      it("should return 400 for malformed version string", async () => {
        const request = new Request("https://api.ucdjs.dev/api/v1/versions/invalid-version/file-tree");
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
        expect(response.headers.get("content-type")).toContain("application/json");

        const error = await response.json();
        expect(error).toHaveProperty("message", "Invalid Unicode version");
        expect(error).toHaveProperty("status", 400);
      });

      it("should return 404 for non-existent routes", async () => {
        const request = new Request("https://api.ucdjs.dev/api/v1/versions/nonexistent/file-tree");
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
      });
    });

    describe("cache", () => {
      it("should set proper cache headers", async () => {
        const request = new Request("https://api.ucdjs.dev/api/v1/versions/15.1.0/file-tree");
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const cacheHeaderValue = response.headers.get("cache-control");
        expect(cacheHeaderValue).toBeTruthy();
      });

      it("should cache the response for subsequent requests", async () => {
        let callCounter = 0;
        fetchMock.get("https://unicode.org")
          .intercept({ path: "/Public/16.0.0/ucd" })
          .reply(200, () => {
            callCounter++;
            return generateAutoIndexHtml(files, "F2");
          }).persist();

        const request1 = new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");
        const ctx1 = createExecutionContext();
        const firstResponse = await worker.fetch(request1, env, ctx1);
        await waitOnExecutionContext(ctx1);
        expect(firstResponse.status).toBe(200);
        expect(callCounter).toBe(1); // First call should hit the network
        expect(firstResponse.headers.get("cf-cache-status")).toBeNull();

        const request2 = new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree");
        const ctx2 = createExecutionContext();
        const secondResponse = await worker.fetch(request2, env, ctx2);
        await waitOnExecutionContext(ctx2);

        expect(secondResponse.status).toBe(200);
        expect(callCounter).toBe(1); // Second call should hit the cache
        expect(secondResponse.headers.get("cf-cache-status")).toBe("HIT");
      });

      it("should not cache responses for invalid versions", async () => {
        const request = new Request("https://api.ucdjs.dev/api/v1/versions/invalid-version/file-tree");
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
        expect(response.headers.get("cf-cache-status")).toBeNull();
      });
    });
  });
});
