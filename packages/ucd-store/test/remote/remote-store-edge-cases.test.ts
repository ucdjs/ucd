import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - Edge Cases", () => {
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

  it("should handle malformed Unicode version strings", async () => {
    const store = await createRemoteUCDStore({
      fs: mockFs,
    });

    // Test invalid version formats
    expect(store.hasVersion("invalid-version")).toBe(false);
    expect(store.hasVersion("15.0")).toBe(false);
    expect(store.hasVersion("")).toBe(false);
    expect(store.hasVersion("15.0.0.0")).toBe(false);

    // Valid versions should work
    expect(store.hasVersion("15.0.0")).toBe(true);
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
});
