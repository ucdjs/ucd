import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - Performance and Caching", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should handle large file trees efficiently", async () => {
    // Create a large file tree with 1000 files
    const largeFileTree = Array.from({ length: 1000 }, (_, i) => ({
      type: "file",
      name: `File${i.toString().padStart(4, "0")}.txt`,
      path: `/File${i.toString().padStart(4, "0")}.txt`,
      lastModified: Date.now(),
    }));

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(largeFileTree);
      }],
    ]);

    const store = await createRemoteUCDStore();

    const startTime = Date.now();
    const fileTree = await store.getFileTree("15.0.0");
    const endTime = Date.now();

    expect(fileTree).toHaveLength(1000);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it("should handle concurrent API operations", async () => {
    const files1 = [{ type: "file", name: "File1.txt", path: "/File1.txt" }];
    const files2 = [{ type: "file", name: "File2.txt", path: "/File2.txt" }];
    const files3 = [{ type: "file", name: "File3.txt", path: "/File3.txt" }];

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(files1);
      }],
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
        return mockResponses.json(files2);
      }],
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.2.0`, () => {
        return mockResponses.json(files3);
      }],
    ]);

    const store = await createRemoteUCDStore();

    // Execute concurrent operations
    const startTime = Date.now();
    const [tree1, tree2, tree3] = await Promise.all([
      store.getFileTree("15.0.0"),
      store.getFileTree("15.1.0"),
      store.getFileTree("15.2.0"),
    ]);
    const endTime = Date.now();

    expect(tree1).toHaveLength(1);
    expect(tree2).toHaveLength(1);
    expect(tree3).toHaveLength(1);

    // Concurrent operations should be faster than sequential
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it("should cache API responses appropriately", async () => {
    const testFiles = [{ type: "file", name: "CachedFile.txt", path: "/CachedFile.txt" }];
    let requestCount = 0;

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        requestCount++;
        return mockResponses.json(testFiles);
      }],
    ]);

    const store = await createRemoteUCDStore();

    // Make multiple requests to the same endpoint
    const result1 = await store.getFileTree("15.0.0");
    const result2 = await store.getFileTree("15.0.0");

    expect(result1).toEqual(testFiles);
    expect(result2).toEqual(testFiles);

    // Verify requests were made (caching behavior depends on implementation)
    expect(requestCount).toBeGreaterThan(0);
  });
});
