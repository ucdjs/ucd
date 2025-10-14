import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { beforeEach, describe, expect, it } from "vitest";
import { customFetch } from "../../src/fetch/fetch";

describe("custom fetch - basic functionality", () => {
  describe("successful requests", () => {
    const JSON_RESPONSE = { message: "success", value: 42 };
    const TEXT_RESPONSE = "Hello, World!";
    const BLOB_RESPONSE = new Blob(["test data"], { type: "application/octet-stream" });
    const ARRAY_BUFFER_RESPONSE = new Uint8Array([1, 2, 3, 4]).buffer;
    const STREAM_RESPONSE = new ReadableStream({
      start(controller) {
        controller.enqueue("streaming data");
        controller.close();
      },
    });

    // Why can't we use beforeAll here? The routes don't seem to stick.
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/json`, () => {
          return HttpResponse.json(JSON_RESPONSE);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/text`, () => {
          return HttpResponse.text(TEXT_RESPONSE);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/blob`, () => {
          return new HttpResponse(BLOB_RESPONSE, {
            status: 200,
            headers: { "Content-Type": "application/octet-stream" },
          });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/array-buffer`, () => {
          return new HttpResponse(ARRAY_BUFFER_RESPONSE, {
            status: 200,
            headers: { "Content-Type": "application/octet-stream" },
          });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/stream`, () => {
          return new HttpResponse(STREAM_RESPONSE, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);
    });

    it("should return data for successful JSON response", async () => {
      const result = await customFetch<typeof JSON_RESPONSE>(`${UCDJS_API_BASE_URL}/json`, {
        parseAs: "json",
      });

      expect(result.data).toEqual(JSON_RESPONSE);
      expect(result.status).toBe(200);
    });

    it("should return text data when parseAs is 'text'", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/text`, { parseAs: "text" });

      expect(result.data).toBe(TEXT_RESPONSE);
      expect(result.status).toBe(200);
    });

    it("should return blob data when parseAs is 'blob'", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/blob`, { parseAs: "blob" });

      expect(result.data).toBeInstanceOf(Blob);
      expect(result.status).toBe(200);
    });

    it("should return arrayBuffer when parseAs is 'arrayBuffer'", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/array-buffer`, { parseAs: "arrayBuffer" });

      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.status).toBe(200);
    });

    it("should return stream when parseAs is 'stream'", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/stream`, { parseAs: "stream" });

      expect(result.data).toBeInstanceOf(ReadableStream);
      expect(result.status).toBe(200);
    });

    it("should use default parseAs of 'json' when not specified", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/json`);

      expect(result.data).toEqual(JSON_RESPONSE);
      expect(result.status).toBe(200);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/not-found`, () => {
          return new HttpResponse(null, { status: 404, statusText: "Not Found" });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/server-error`, () => {
          return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/bad-request`, () => {
          return new HttpResponse(null, { status: 400, statusText: "Bad Request" });
        }],
      ]);
    });

    it("should throw error for 404 responses", async () => {
      await expect(customFetch(`${UCDJS_API_BASE_URL}/not-found`)).rejects.toThrow();
    });

    it("should throw error for 500 responses", async () => {
      await expect(customFetch(`${UCDJS_API_BASE_URL}/server-error`)).rejects.toThrow();
    });

    it("should throw error for 400 responses", async () => {
      await expect(customFetch(`${UCDJS_API_BASE_URL}/bad-request`)).rejects.toThrow();
    });
  });

  describe("request methods", () => {
    beforeEach(() => {
      mockFetch([
        ["POST", `${UCDJS_API_BASE_URL}/create`, () => {
          return HttpResponse.json({ id: 123, created: true });
        }],
        ["PUT", `${UCDJS_API_BASE_URL}/update`, () => {
          return HttpResponse.json({ id: 123, updated: true });
        }],
        ["PATCH", `${UCDJS_API_BASE_URL}/patch`, () => {
          return HttpResponse.json({ id: 123, patched: true });
        }],
        ["DELETE", `${UCDJS_API_BASE_URL}/delete`, () => {
          return HttpResponse.json({ deleted: true });
        }],
      ]);
    });

    it("should handle POST requests", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/create`, {
        method: "POST",
        body: { name: "test" },
      });

      expect(result.data).toEqual({ id: 123, created: true });
    });

    it("should handle PUT requests", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/update`, {
        method: "PUT",
        body: { name: "updated" },
      });

      expect(result.data).toEqual({ id: 123, updated: true });
    });

    it("should handle PATCH requests", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/patch`, {
        method: "PATCH",
        body: { name: "patched" },
      });

      expect(result.data).toEqual({ id: 123, patched: true });
    });

    it("should handle DELETE requests", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/delete`, {
        method: "DELETE",
      });

      expect(result.data).toEqual({ deleted: true });
    });
  });

  describe("headers and query parameters", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/headers`, ({ request }) => {
          const auth = request.headers.get("Authorization");
          const custom = request.headers.get("X-Custom-Header");
          return HttpResponse.json({ auth, custom });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/query`, ({ request }) => {
          const url = new URL(request.url);
          const params = Object.fromEntries(url.searchParams);
          return HttpResponse.json(params);
        }],
      ]);
    });

    it("should send custom headers", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/headers`, {
        headers: {
          "Authorization": "Bearer token123",
          "X-Custom-Header": "custom-value",
        },
      });

      expect(result.data).toEqual({
        auth: "Bearer token123",
        custom: "custom-value",
      });
    });

    it("should handle query parameters", async () => {
      const result = await customFetch(`${UCDJS_API_BASE_URL}/query?page=1&limit=10&sort=name`);

      expect(result.data).toEqual({
        page: "1",
        limit: "10",
        sort: "name",
      });
    });
  });

  describe("safe method", () => {
    beforeEach(() => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/success`, () => {
          return HttpResponse.json({ success: true });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/error`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);
    });

    it("should return data and response for successful requests", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/success`);

      expect(result).toEqual({
        data: { success: true },
        error: null,
        response: expect.any(Object),
      });
      expect(result.response?.status).toBe(200);
    });

    it("should return error and response for failed requests", async () => {
      const result = await customFetch.safe(`${UCDJS_API_BASE_URL}/error`);

      expect(result).toEqual({
        data: null,
        error: expect.any(Object),
        response: expect.any(Object),
      });
      expect(result.response?.status).toBe(404);
    });
  });

  describe("timeout", () => {
    it("should timeout after specified duration", async () => {
      // Mock a slow response that takes longer than timeout
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/slow`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ data: "slow" });
        }],
      ]);

      await expect(customFetch(`${UCDJS_API_BASE_URL}/slow`, {
        timeout: 50, // 50ms timeout
      })).rejects.toThrow("TimeoutError");
    });
  });
});
