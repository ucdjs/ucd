import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - Version Management", () => {
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

  it("should return all available versions", async () => {
    const store = await createRemoteUCDStore({
      fs: mockFs,
    });

    expect(store.versions).toBeDefined();
    expect(store.versions.length).toBeGreaterThan(0);
    expect(store.versions).toEqual(UNICODE_VERSION_METADATA.map((v) => v.version));
  });

  it("should check version existence correctly", async () => {
    const store = await createRemoteUCDStore({
      fs: mockFs,
    });

    expect(store.hasVersion("15.0.0")).toBe(true);
    expect(store.hasVersion("99.99.99")).toBe(false);
  });

  it("should handle version list immutability", async () => {
    const store = await createRemoteUCDStore({
      fs: mockFs,
    });

    expect(() => {
      // Attempt to modify the versions array directly
      (store.versions as string[]).push("99.99.99");
    }).toThrow("Cannot add property 37, object is not extensible");

    expect(store.hasVersion("99.99.99")).toBe(false);
    expect(store.versions.length).toBe(UNICODE_VERSION_METADATA.length);
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
});
