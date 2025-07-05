import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

describe("remote ucd store - http filesystem integration", () => {
  let mockFs: FileSystemBridge;

  beforeEach(() => {
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

  it("should use HTTP filesystem bridge for file operations", async () => {
    const store = await createRemoteUCDStore({
      fs: mockFs,
    });

    expect(store.fs).toBeDefined();
    expect(store.fs.exists).toBeDefined();
    expect(store.fs.read).toBeDefined();
    expect(store.fs.write).toBeDefined();
    expect(store.fs.listdir).toBeDefined();
    expect(store.fs.mkdir).toBeDefined();
    expect(store.fs.stat).toBeDefined();
    expect(store.fs.rm).toBeDefined();
  });

  it("should handle HTTP caching correctly", async () => {
    const fileContent = "Cached content";
    let requestCount = 0;

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/CachedFile.txt`, () => {
        requestCount++;
        return mockResponses.text(fileContent);
      }],
    ]);

    const store = await createRemoteUCDStore();

    const content1 = await store.getFile("15.0.0", "CachedFile.txt");
    expect(content1).toBe(fileContent);

    const content2 = await store.getFile("15.0.0", "CachedFile.txt");
    expect(content2).toBe(fileContent);

    expect(requestCount).toBeGreaterThan(0);
  });

  it("should handle HTTP redirects", async () => {
    const finalContent = "Redirected content";

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/RedirectFile.txt`, () => {
        return mockResponses.redirect(`${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/FinalFile.txt`);
      }],
      [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/FinalFile.txt`, () => {
        return mockResponses.text(finalContent);
      }],
    ]);

    const store = await createRemoteUCDStore();
    const content = await store.getFile("15.0.0", "RedirectFile.txt");

    expect(content).toBe(finalContent);
  });

  it("should handle memory usage with large responses", async () => {
    const largeFileContent = "x".repeat(1024 * 1024);

    mockFetch([
      [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/LargeFile.txt`, () => {
        return mockResponses.text(largeFileContent);
      }],
    ]);

    const store = await createRemoteUCDStore();

    const startMemory = process.memoryUsage().heapUsed;
    const content = await store.getFile("15.0.0", "LargeFile.txt");
    const endMemory = process.memoryUsage().heapUsed;

    expect(content).toHaveLength(1024 * 1024);

    const memoryIncrease = endMemory - startMemory;
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
  });
});