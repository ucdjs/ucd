import { existsSync } from "node:fs";
import { HttpResponse } from "#internal/test-utils/msw";
import { setupMockStore } from "#internal/test-utils/store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("store mirror", () => {
  beforeEach(() => {
    setupMockStore({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
        "/api/v1/versions/:version/file-tree": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1651584360000,
          },
          {
            type: "directory",
            name: "extracted",
            path: "extracted",
            lastModified: 1724676960000,
            children: [
              {
                type: "file",
                name: "DerivedBidiClass.txt",
                path: "DerivedBidiClass.txt",
                lastModified: 1724609100000,
              },
            ],
          },
        ],
        "/api/v1/files/:wildcard": () => {
          return HttpResponse.text("File content");
        },
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should mirror files to store", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(true);
  });

  it("should mirror multiple versions", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0", "16.0.0"],
    });

    await store.init();
    const mirrorResults = await store.mirror();

    const [mirror15Result, mirror16Result] = mirrorResults;

    expect(mirror15Result?.version).toBe("15.0.0");
    expect(mirror16Result?.version).toBe("16.0.0");

    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/16.0.0/ArabicShaping.txt`)).toBe(true);
  });

  it("should handle dry run mode", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror({ dryRun: true });

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(false);
  });

  it("should handle force flag", async () => {
    const content = "old content";

    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": content,
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror({ force: true });

    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);

    const newContent = await store.getFile("15.0.0", "ArabicShaping.txt");

    expect(newContent).toBe("File content");
  });

  it("should require store to be initialized", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await expect(store.mirror()).rejects.toThrow("Store is not initialized");
  });

  it("should handle concurrency validation error", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    await expect(store.mirror({ concurrency: 0 })).rejects.toThrow("Concurrency must be at least 1");
  });

  it("should handle version not found error", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    // Version not in store.versions should return empty result due to catch block
    const result = await store.mirror({ versions: ["99.99.99"] });
    expect(result).toEqual([]);
  });

  it("should handle API errors during file fetching", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    // Mock getExpectedFilePaths to throw an API error
    const originalFiles = await import("../src/internal/files");
    const mockGetExpectedFilePaths = vi.spyOn(originalFiles, "getExpectedFilePaths");
    mockGetExpectedFilePaths.mockRejectedValue(new Error("API Error"));

    const result = await store.mirror();

    // Should return empty array due to catch block
    expect(result).toEqual([]);

    mockGetExpectedFilePaths.mockRestore();
  });

  it("should handle missing content-type header during file download", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    // Mock the client differently for getExpectedFilePaths vs file download
    const originalGet = store.client.GET;
    store.client.GET = vi.fn().mockImplementation((path, config) => {
      // For file tree requests, return normal response
      if (path.includes("file-tree")) {
        return originalGet.call(store.client, path, config);
      }
      
      // For file download requests, return response without content-type header
      const mockResponse = {
        headers: {
          get: vi.fn().mockReturnValue(null), // No content-type header
        },
        text: vi.fn().mockResolvedValue("file content"),
      };

      return Promise.resolve({
        error: null,
        response: mockResponse,
      });
    });

    const [mirrorResult] = await store.mirror();

    expect(mirrorResult?.version).toBe("15.0.0");
    expect(mirrorResult?.failed.length).toBeGreaterThan(0);

    // Restore original function
    store.client.GET = originalGet;
  });

  it("should handle different content types during file download", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    let fileCallCount = 0;
    const originalGet = store.client.GET;
    
    store.client.GET = vi.fn().mockImplementation((path, config) => {
      // For file tree requests, return normal response
      if (path.includes("file-tree")) {
        return originalGet.call(store.client, path, config);
      }
      
      // For file download requests, cycle through different content types
      fileCallCount++;
      const contentTypes = [
        "application/json",
        "text/plain", 
        "application/octet-stream",
      ];
      
      const contentType = contentTypes[(fileCallCount - 1) % contentTypes.length];
      const mockResponse = {
        headers: {
          get: vi.fn().mockReturnValue(contentType),
        },
        json: vi.fn().mockResolvedValue({ data: "json content" }),
        text: vi.fn().mockResolvedValue("text content"),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      };

      return Promise.resolve({
        error: null,
        response: mockResponse,
      });
    });

    const [mirrorResult] = await store.mirror();

    expect(mirrorResult?.version).toBe("15.0.0");
    expect(mirrorResult?.mirrored.length).toBeGreaterThan(0);

    // Restore original function
    store.client.GET = originalGet;
  });

  it("should handle file operation errors during mirroring", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    // Mock fs.write to throw an error
    const originalWrite = store.fs.write;
    store.fs.write = vi.fn().mockRejectedValue(new Error("Disk full"));

    const [mirrorResult] = await store.mirror();

    expect(mirrorResult?.version).toBe("15.0.0");
    expect(mirrorResult?.failed.length).toBeGreaterThan(0);

    // Restore original function
    store.fs.write = originalWrite;
  });

  it("should return empty result on catastrophic error", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    // Mock getExpectedFilePaths to throw an error early in the process
    const originalFiles = await import("../src/internal/files");
    const mockGetExpectedFilePaths = vi.spyOn(originalFiles, "getExpectedFilePaths");
    mockGetExpectedFilePaths.mockRejectedValue(new Error("Network failure"));

    const result = await store.mirror();

    expect(result).toEqual([]);

    mockGetExpectedFilePaths.mockRestore();
  });
});
