import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - Error Handling", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should handle network connectivity issues", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.timeout("Network connectivity lost");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("15.0.0"))
      .rejects.toThrow("Network connectivity lost");
  });

  it("should handle API rate limiting", async () => {
    let retryCount = 0;

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        retryCount++;
        if (retryCount < 3) {
          return mockResponses.tooManyRequests("Rate limit exceeded");
        }
        return mockResponses.json([]);
      }],
    ]);

    const store = await createRemoteUCDStore();

    // Should eventually succeed after rate limit retries
    const result = await store.getFileTree("15.0.0");
    expect(result).toEqual([]);
    expect(retryCount).toBe(3);
  });

  it("should handle malformed API responses", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.text("Invalid JSON response");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("15.0.0"))
      .rejects.toThrow();
  });

  it("should handle HTTP 404 errors", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.notFound("Version not found");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("15.0.0"))
      .rejects.toThrow("Version not found");
  });

  it("should handle HTTP 500 errors", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.serverError("Internal server error");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("15.0.0"))
      .rejects.toThrow("Internal server error");
  });

  it("should handle timeout errors", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.timeout("Request timeout");
      }],
    ]);

    const store = await createRemoteUCDStore();

    await expect(() => store.getFileTree("15.0.0"))
      .rejects.toThrow("Request timeout");
  });

  it("should handle empty or null responses from API", async () => {
    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        return mockResponses.json(null);
      }],
    ]);

    const store = await createRemoteUCDStore();

    // Should handle null responses gracefully
    await expect(() => store.getFileTree("15.0.0"))
      .rejects.toThrow();
  });

  it("should handle remote store error recovery", async () => {
    let attemptCount = 0;
    const testFiles = [{ type: "file", name: "RecoveryFile.txt", path: "/RecoveryFile.txt" }];

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
        attemptCount++;
        if (attemptCount < 3) {
          return mockResponses.serverError("Temporary server error");
        }
        return mockResponses.json(testFiles);
      }],
    ]);

    const store = await createRemoteUCDStore();

    // Should recover after retries
    const fileTree = await store.getFileTree("15.0.0");
    expect(fileTree).toEqual(testFiles);
    expect(attemptCount).toBe(3);
  });
});
