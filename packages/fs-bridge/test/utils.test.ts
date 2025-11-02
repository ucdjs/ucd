import { describe, expect, it, vi } from "vitest";
import { detectVitestMockFunctionRuntimeMode } from "../src/utils";

describe("detectVitestMockFunctionRuntimeMode", () => {
  it("should detect async implementation", () => {
    const asyncMock = vi.fn(async () => "result");

    const result = detectVitestMockFunctionRuntimeMode(asyncMock);

    expect(result).toBe(true);
  });

  it("should detect mockResolvedValue", () => {
    const mock = vi.fn().mockResolvedValue("result");

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(true);
  });

  it("should detect mockRejectedValue", () => {
    const mock = vi.fn().mockRejectedValue(new Error("test error"));

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(true);
  });

  it("should detect sync implementation", () => {
    const syncMock = vi.fn(() => "result");

    const result = detectVitestMockFunctionRuntimeMode(syncMock);

    expect(result).toBe(false);
  });

  it("should detect mockReturnValue as sync", () => {
    const mock = vi.fn().mockReturnValue("result");

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(false);
  });

  it("should handle mock with results from previous calls", async () => {
    const asyncMock = vi.fn().mockResolvedValue("result");

    // Call the mock first to populate results
    await asyncMock();

    const result = detectVitestMockFunctionRuntimeMode(asyncMock);

    expect(result).toBe(true);
  });

  it("should handle mock with sync results from previous calls", () => {
    const syncMock = vi.fn().mockReturnValue("result");

    // Call the mock first to populate results
    syncMock();

    const result = detectVitestMockFunctionRuntimeMode(syncMock);

    expect(result).toBe(false);
  });

  it("should detect custom async function that returns Promise", () => {
    const customAsyncMock = vi.fn(() => Promise.resolve("result"));

    const result = detectVitestMockFunctionRuntimeMode(customAsyncMock);

    expect(result).toBe(true);
  });

  it("should handle mock with implementation changed multiple times", async () => {
    const mock = vi.fn().mockReturnValue("sync");

    // First call is sync
    mock();
    expect(detectVitestMockFunctionRuntimeMode(mock)).toBe(false);

    // Change to async
    mock.mockResolvedValue("async");
    await mock();

    // Should now detect as async (based on latest result)
    expect(detectVitestMockFunctionRuntimeMode(mock)).toBe(true);
  });

  it("should handle mock with no results yet", () => {
    const mock = vi.fn().mockResolvedValue("result");

    // Don't call the mock, so no results
    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(true);
  });

  it("should handle mock with error result", async () => {
    const mock = vi.fn().mockRejectedValue(new Error("test"));

    try {
      await mock();
    } catch {
      // Expected
    }

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(true);
  });

  it("should handle empty mock", () => {
    const mock = vi.fn();

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(false);
  });

  it("should detect Promise-returning function", () => {
    const mock = vi.fn(() => new Promise((resolve) => resolve("result")));

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(true);
  });

  it("should detect async when implementation returns Promise on subsequent call", () => {
    let i = 0;
    const mock = vi.fn(() => {
      i++;
      if (i === 2) {
        return Promise.resolve("done");
      }

      return i;
    });

    const result = detectVitestMockFunctionRuntimeMode(mock);

    expect(result).toBe(true);
  });

  it("should throw error when spy is used for required operations", () => {
    const apples = 0;
    const cart = {
      getApples: async () => 42,
    };

    const spy = vi.spyOn(cart, "getApples").mockImplementation(async () => apples);

    const result = detectVitestMockFunctionRuntimeMode(spy);

    expect(result).toBe(true);
  });
});
