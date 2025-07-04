import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "@ucdjs/ucd-store";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - File Tree Operations", () => {
  const mockFiles = [
    {
      type: "file",
      name: "ArabicShaping.txt",
      path: "/ArabicShaping.txt",
      lastModified: 1644920820000,
    },
    {
      type: "file",
      name: "BidiBrackets.txt",
      path: "/BidiBrackets.txt",
      lastModified: 1651584360000,
    },
    {
      type: "file",
      name: "BidiCharacterTest.txt",
      path: "/BidiCharacterTest.txt",
      lastModified: 1651584300000,
    },
    {
      type: "directory",
      name: "extracted",
      path: "/extracted/",
      lastModified: 1724676960000,
      children: [
        {
          type: "file",
          name: "DerivedBidiClass.txt",
          path: "/DerivedBidiClass.txt",
          lastModified: 1724609100000,
        },
      ],
    },
  ];

  let mockFs: FileSystemBridge;

  beforeEach(() => {
    // Setup mock filesystem bridge for remote mode
    mockFs = {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      listdir: vi.fn(),
      mkdir: vi.fn(),
      stat: vi.fn(),
      rm: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should fetch file tree from remote API", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(mockFiles);
      }],
    ]);

    const store = await createRemoteUCDStore();

    expect(store).toBeDefined();
    const fileTree = await store.getFileTree("15.0.0");

    expect(fileTree).toBeDefined();
    expect(fileTree.length).toBe(4);
    expect(flattenFilePaths(fileTree)).toEqual([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
      "BidiCharacterTest.txt",
      "extracted/DerivedBidiClass.txt",
    ]);
  });

  it("should apply filters to remote file tree", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(mockFiles);
      }],
    ]);

    const store = await createRemoteUCDStore({
      globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES],
    });
    const fileTree = await store.getFileTree("15.0.0");

    expect(fileTree).toBeDefined();
    expect(fileTree.length).toBeLessThan(mockFiles.length);
  });

  it("should apply extra filters to remote file tree", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(mockFiles);
      }],
    ]);

    const store = await createRemoteUCDStore({});

    const fileTree = await store.getFileTree("15.0.0");
    const fileTreeWithFilters = await store.getFileTree("15.0.0", [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES]);

    expect(fileTreeWithFilters).toBeDefined();
    expect(fileTreeWithFilters.length).toBeLessThan(fileTree.length);
    expect(flattenFilePaths(fileTreeWithFilters)).not.toContain("BidiCharacterTest.txt");
  });

  it("should handle empty file tree response", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json([]);
      }],
    ]);

    const store = await createRemoteUCDStore();
    const fileTree = await store.getFileTree("15.0.0");

    expect(fileTree).toBeDefined();
    expect(fileTree.length).toBe(0);
  });

  it("should throw error for non-existent version", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/99.99.99`, () => {
        return mockResponses.notFound("Version not found");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("99.99.99")).rejects.toThrow("Version '99.99.99' not found in store");
  });

  it("should handle API errors with retry logic", async () => {
    let retryCount = 0;
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        console.error("Simulating API error for retry test");
        retryCount++;
        if (retryCount < 2) {
          return mockResponses.serverError("Temporary error, retrying...");
        }
        return mockResponses.json(mockFiles);
      }],
    ]);

    const store = await createRemoteUCDStore();

    const fileTree = await store.getFileTree("15.0.0");
    expect(store).toBeDefined();
    expect(retryCount).toBe(2);
  });

  it("should handle network timeout errors", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.timeout("Network timeout");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("15.0.0")).rejects.toThrow("Network timeout");
  });

  it("should handle deeply nested directory structures", async () => {
    const deeplyNestedFiles = [
      {
        type: "directory",
        name: "level1",
        path: "/level1/",
        children: [
          {
            type: "directory",
            name: "level2",
            path: "/level2/",
            children: [
              {
                type: "file",
                name: "deep-file.txt",
                path: "/deep-file.txt",
              },
            ],
          },
        ],
      },
    ];

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(deeplyNestedFiles);
      }],
    ]);

    const store = await createRemoteUCDStore();
    const filePaths = await store.getFilePaths("15.0.0");

    expect(filePaths).toEqual(["level1/level2/deep-file.txt"]);
  });

  it("should handle very large remote file trees", async () => {
    // Create a very large nested structure
    const largeNestedTree = {
      type: "directory",
      name: "large-dir",
      path: "/large-dir/",
      children: Array.from({ length: 500 }, (_, i) => ({
        type: "file",
        name: `large-file-${i}.txt`,
        path: `/large-file-${i}.txt`,
      })),
    };

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json([largeNestedTree]);
      }],
    ]);

    const store = await createRemoteUCDStore();

    const startTime = Date.now();
    const filePaths = await store.getFilePaths("15.0.0");
    const endTime = Date.now();

    expect(filePaths).toHaveLength(500);
    expect(filePaths[0]).toBe("large-dir/large-file-0.txt");
    expect(filePaths[499]).toBe("large-dir/large-file-499.txt");

    // Should process large trees efficiently
    expect(endTime - startTime).toBeLessThan(2000);
  });
});
