import { env, fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { executeRequest } from "../helpers/request";
import { expectApiError } from "../helpers/response";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("shared", () => {
  describe("api error response structure", () => {
    it("should return consistent error response format for 404", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/nonexistent/route"),
        env,
      );

      const error = await expectApiError(response, { status: 404 });
      expect(error).toHaveProperty("status", 404);
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("timestamp");
      expect(typeof error.message).toBe("string");
      expect(typeof error.timestamp).toBe("string");
    });

    it("should return consistent error response format for 400", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/files/..%2Ftest"),
        env,
      );

      const error = await expectApiError(response, { status: 400 });
      expect(error).toHaveProperty("status", 400);
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("timestamp");
      expect(typeof error.message).toBe("string");
      expect(typeof error.timestamp).toBe("string");
    });
  });
});
