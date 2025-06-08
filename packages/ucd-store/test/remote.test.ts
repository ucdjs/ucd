import type { Mock } from "vitest";
import type { UnicodeVersionFile } from "../src/store";
import { mockFetch } from "#msw-utils";
import { promiseRetry } from "@luxass/utils";
import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteUCDStore } from "../src/remote";

vi.mock("@luxass/utils", () => ({
  promiseRetry: vi.fn(),
}));

const mockPromiseRetry = promiseRetry as Mock;

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPromiseRetry.mockImplementation(async (fn: () => Promise<any>) => {
      return fn();
    });
  });

  describe("initialization", () => {
    it("should initialize with default options", () => {
      const store = new RemoteUCDStore();
      expect(store.baseUrl).toBeDefined();
      expect(store.proxyUrl).toBeDefined();
      expect(store.filterPatterns).toBeDefined();
    });

    it("should initialize with custom options", () => {
      const customOptions = {
        baseUrl: "https://luxass.dev",
        proxyUrl: "https://proxy.luxass.dev",
        filters: ["**Shaping.txt"],
      };

      const customStore = new RemoteUCDStore(customOptions);

      expect(customStore.baseUrl).toBe("https://luxass.dev");
      expect(customStore.proxyUrl).toBe("https://proxy.luxass.dev");
      expect(customStore.filterPatterns).toEqual(["**Shaping.txt"]);
    });

    it("should return available versions from metadata", () => {
      const store = new RemoteUCDStore();
      const versions = store.versions;
      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);
    });

    it("should expose file cache as a Map", () => {
      const store = new RemoteUCDStore();

      const cache = store.fileCache;
      expect(cache).toBeInstanceOf(Map);
      expect(cache.size).toBe(0);
    });

    it("should have bootstrap as no-op function", () => {
      const store = new RemoteUCDStore();

      expect(() => store.bootstrap()).not.toThrow();
    });
  });

  it("should fetch and return file tree for a version", async () => {
    const store = new RemoteUCDStore();

    const mockFileTree: UnicodeVersionFile[] = [
      {
        name: "UnicodeData.txt",
        path: "UnicodeData.txt",
        children: undefined,
      },
      {
        name: "auxiliary",
        path: "auxiliary",
        children: [
          {
            name: "WordBreakProperty.txt",
            path: "auxiliary/WordBreakProperty.txt",
            children: undefined,
          },
        ],
      },
    ];

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse(JSON.stringify(mockFileTree), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }],
    ]);

    const result = await store.getFileTree("15.1.0");
    expect(result).toEqual(mockFileTree);
  });

  it("should handle getFileTree API errors", async () => {
    const store = new RemoteUCDStore();

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse(null, { status: 404 });
      }],
    ]);

    mockPromiseRetry.mockRejectedValueOnce(new Error("HTTP 404: Not Found"));

    await expect(store.getFileTree("15.1.0")).rejects.toThrow("HTTP 404: Not Found");
  });

  it("should process nested file structure correctly", async () => {
    const store = new RemoteUCDStore();

    const rawStructure = [
      {
        name: "root.txt",
        path: "root.txt",
        children: [
          {
            name: "nested.txt",
            path: "root.txt/nested.txt",
          },
        ],
      },
    ];

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse(JSON.stringify(rawStructure), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }],
    ]);

    const result = await store.getFileTree("15.1.0");

    expect(result).toEqual([
      {
        name: "root.txt",
        path: "root.txt",
        children: [
          {
            name: "nested.txt",
            path: "root.txt/nested.txt",
            children: undefined,
          },
        ],
      },
    ]);
  });

  it("should fetch and cache file content", async () => {
    const store = new RemoteUCDStore();

    const mockFileContent = "File content here";

    mockFetch([
      [`GET ${store.proxyUrl}/15.1.0/ucd/UnicodeData.txt`, () => {
        return new HttpResponse(mockFileContent, { status: 200 });
      }],
    ]);

    const result = await store.getFile("15.1.0", "UnicodeData.txt");

    expect(result).toBe(mockFileContent);
    expect(store.fileCache.get("15.1.0/UnicodeData.txt")).toBe(mockFileContent);
  });

  it("should return cached content on subsequent getFile calls", async () => {
    const store = new RemoteUCDStore();

    const mockFileContent = "File content here";

    // First call - should fetch
    mockFetch([
      [`GET ${store.proxyUrl}/15.1.0/ucd/UnicodeData.txt`, () => {
        return new HttpResponse(mockFileContent, { status: 200 });
      }],
    ]);

    const result1 = await store.getFile("15.1.0", "UnicodeData.txt");
    expect(result1).toBe(mockFileContent);

    // Second call - should use cache (no additional HTTP call)
    const result2 = await store.getFile("15.1.0", "UnicodeData.txt");
    expect(result2).toBe(mockFileContent);

    // Verify promiseRetry was only called once
    expect(mockPromiseRetry).toHaveBeenCalledTimes(1);
  });

  it("should handle getFile fetch errors", async () => {
    const store = new RemoteUCDStore();

    mockFetch([
      [`GET ${store.proxyUrl}/15.1.0/NonExistent.txt`, () => {
        return new HttpResponse(null, { status: 404 });
      }],
    ]);

    mockPromiseRetry.mockRejectedValueOnce(new Error("HTTP 404: Not Found"));

    await expect(store.getFile("15.1.0", "NonExistent.txt")).rejects.toThrow("HTTP 404: Not Found");
  });

  it("should return true for existing versions in hasVersion", async () => {
    const store = new RemoteUCDStore();

    const versions = store.versions;
    if (versions.length > 0) {
      const result = await store.hasVersion(versions[0]!);
      expect(result).toBe(true);
    }
  });

  it("should return false for non-existing versions in hasVersion", async () => {
    const store = new RemoteUCDStore();

    const result = await store.hasVersion("99.0.0");
    expect(result).toBe(false);
  });

  it("should return flattened file paths from getFilePaths", async () => {
    const store = new RemoteUCDStore();

    const mockFileTree: UnicodeVersionFile[] = [
      {
        name: "UnicodeData.txt",
        path: "UnicodeData.txt",
        children: undefined,
      },
      {
        name: "auxiliary",
        path: "auxiliary",
        children: [
          {
            name: "WordBreakProperty.txt",
            path: "auxiliary/WordBreakProperty.txt",
            children: undefined,
          },
          {
            name: "subfolder",
            path: "auxiliary/subfolder",
            children: [
              {
                name: "nested.txt",
                path: "auxiliary/subfolder/nested.txt",
                children: undefined,
              },
            ],
          },
        ],
      },
    ];

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse(JSON.stringify(mockFileTree), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }],
    ]);

    const result = await store.getFilePaths("15.1.0");

    expect(result).toEqual([
      "UnicodeData.txt",
      "auxiliary/WordBreakProperty.txt",
      "auxiliary/subfolder/nested.txt",
    ]);
  });

  it("should handle empty file tree in getFilePaths", async () => {
    const store = new RemoteUCDStore();

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }],
    ]);

    const result = await store.getFilePaths("15.1.0");
    expect(result).toEqual([]);
  });

  it("should clear the file cache when clearCache is called", async () => {
    const store = new RemoteUCDStore();

    // Add something to cache first
    mockFetch([
      [`GET ${store.proxyUrl}/15.1.0/UnicodeData.txt`, () => {
        return new HttpResponse("content", { status: 200 });
      }],
    ]);

    await store.getFile("15.1.0", "UnicodeData.txt");
    expect(store.fileCache.size).toBe(1);

    store.clearCache();
    expect(store.fileCache.size).toBe(0);
  });

  it("should use promiseRetry with correct configuration for network requests", async () => {
    const store = new RemoteUCDStore();

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }],
    ]);

    await store.getFileTree("15.1.0");

    expect(mockPromiseRetry).toHaveBeenCalledWith(
      expect.any(Function),
      { retries: 3 },
    );
  });

  it("should handle promiseRetry failures", async () => {
    const store = new RemoteUCDStore();

    const error = new Error("Network error");
    mockPromiseRetry.mockRejectedValueOnce(error);

    await expect(store.getFileTree("15.1.0")).rejects.toThrow("Network error");
  });

  it("should handle malformed API responses", async () => {
    const store = new RemoteUCDStore();

    mockFetch([
      [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
        return new HttpResponse("invalid json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }],
    ]);

    mockPromiseRetry.mockImplementation(async (fn) => {
      const response = await fn();
      response.json = () => Promise.reject(new Error("Invalid JSON"));
      return response;
    });

    await expect(() => store.getFileTree("15.1.0")).rejects.toThrow("Unexpected token 'i', \"invalid json\" is not valid JSON");
  });

  it("should handle files with special characters in paths", async () => {
    const store = new RemoteUCDStore();

    mockFetch([
      [`GET ${store.proxyUrl}/15.1.0/ucd/special%20file%20name.txt`, () => {
        return new HttpResponse("content", { status: 200 });
      }],
    ]);

    const result = await store.getFile("15.1.0", "special file name.txt");
    expect(result).toBe("content");
    expect(store.fileCache.has("15.1.0/special file name.txt")).toBe(true);
  });

  describe("filtering", () => {
    it("should apply filters to file paths", async () => {
      const store = new RemoteUCDStore({
        filters: ["**Shaping.txt"],
      });

      const mockFileTree: UnicodeVersionFile[] = [
        {
          name: "UnicodeData.txt",
          path: "UnicodeData.txt",
        },
        {
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
        },
      ];

      mockFetch([
        [`GET ${store.baseUrl}/api/v1/unicode-files/15.1.0`, () => {
          return new HttpResponse(JSON.stringify(mockFileTree), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const result = await store.getFileTree("15.1.0");
      expect(result).toEqual([
        {
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
        },
      ]);
    });
  });
});
