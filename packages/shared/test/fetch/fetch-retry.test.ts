import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customFetch } from "../../src/fetch/fetch";

describe("custom fetch - retry functionality", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("automatic retries", () => {
    let retryCount = 0;

    beforeEach(() => {
      retryCount = 0;
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/retry`, () => {
          retryCount++;
          if (retryCount < 3) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json({ success: true });
        }],
      ]);
    });

    it("should retry on server errors (5xx)", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/retry`, {
        retry: 3,
      });

      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;

      expect(retryCount).toBe(3);
      expect(result.data).toEqual({ success: true });
    });

    it("should retry on specific status codes", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/retry-custom`, () => {
          retryCount++;
          if (retryCount < 2) {
            return new HttpResponse(null, { status: 429 });
          }
          return HttpResponse.json({ success: true });
        }],
      ]);

      const promise = customFetch(`${UCDJS_API_BASE_URL}/retry-custom`, {
        retry: 2,
        retryStatusCodes: [429],
      });

      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;

      expect(retryCount).toBe(2);
      expect(result.data).toEqual({ success: true });
    });

    it("should not retry when retry is false", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/retry`, {
        retry: false,
      });

      await expect(promise).rejects.toThrow();
      expect(retryCount).toBe(1);
    });

    it("should not retry on client errors (4xx) by default", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/client-error`, () => {
          retryCount++;
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const promise = customFetch(`${UCDJS_API_BASE_URL}/client-error`);

      await expect(promise).rejects.toThrow();
      expect(retryCount).toBe(1);
    });

    it("should retry on client errors when configured", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/client-error-retry`, () => {
          retryCount++;
          if (retryCount < 2) {
            return new HttpResponse(null, { status: 404 });
          }
          return HttpResponse.json({ success: true });
        }],
      ]);

      const promise = customFetch(`${UCDJS_API_BASE_URL}/client-error-retry`, {
        retry: 2,
        retryStatusCodes: [404],
      });

      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;

      expect(retryCount).toBe(2);
      expect(result.data).toEqual({ success: true });
    });
  });

  describe("retry delay", () => {
    let retryCount = 0;

    beforeEach(() => {
      retryCount = 0;
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/retry-delay`, () => {
          retryCount++;
          if (retryCount < 3) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json({ success: true });
        }],
      ]);
    });

    it("should use default retry delay", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/retry-delay`, {
        retry: 3,
        retryDelay: 100,
      });

      // first retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(retryCount).toBe(2);

      // second retry after another 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(retryCount).toBe(3);

      const result = await promise;
      expect(result.data).toEqual({ success: true });
    });

    it("should use custom retry delay function", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/retry-delay`, {
        retry: 3,
        retryDelay: (context) => context.retryAttempt * 50, // 50ms, then 100ms
      });

      // first retry after 50ms
      await vi.advanceTimersByTimeAsync(50);
      expect(retryCount).toBe(2);

      // second retry after another 100ms (total 150ms)
      await vi.advanceTimersByTimeAsync(100);
      expect(retryCount).toBe(3);

      const result = await promise;
      expect(result.data).toEqual({ success: true });
    });
  });

  describe("retry limits", () => {
    let retryCount = 0;

    beforeEach(() => {
      retryCount = 0;
      mockFetch([
        [["GET", "POST"], `${UCDJS_API_BASE_URL}/always-fail`, () => {
          retryCount++;
          return new HttpResponse(null, { status: 500 });
        }],
      ]);
    });

    it("should respect maximum retry count", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/always-fail`, {
        retry: 2,
      });

      const expectPromise = expect(promise).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(0);
      await expectPromise;

      expect(retryCount).toBe(3); // 1 initial + 2 retries
    });

    it("should not retry for payload methods by default", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/always-fail`, {
        method: "POST",
        body: { data: "test" },
      });

      await expect(promise).rejects.toThrow();
      expect(retryCount).toBe(1); // 1 initial attempt, no retries
    });

    it("should retry payload methods when explicitly configured", async () => {
      const promise = customFetch(`${UCDJS_API_BASE_URL}/always-fail`, {
        method: "POST",
        body: { data: "test" },
        retry: 1,
      });

      const expectPromise = expect(promise).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(0);
      await expectPromise;

      expect(retryCount).toBe(2); // 1 initial + 1 retry
    });
  });

  it("should not retry on abort errors", async () => {
    let callCount = 0;
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/abort-test`, async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ success: true });
      }],
    ]);

    const controller = new AbortController();
    const promise = customFetch(`${UCDJS_API_BASE_URL}/abort-test`, {
      retry: 3,
      signal: controller.signal,
    });

    // abort the request immediately
    controller.abort();

    await expect(promise).rejects.toThrow();
    expect(callCount).toBe(1);
  });
});
