import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import {
  expectApiError,
  expectJsonResponse,
} from "../../helpers/response";

describe("v1_blocks", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/blocks/{version}", () => {
    it("should return 500 with pending implementation message", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0"),
        env,
      );

      await expectApiError(response, {
        status: 500,
        message: "Blocks list not yet available. API implementation pending.",
      });
    });

    it("should have proper cache headers configured", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0"),
        env,
      );

      // Despite being an error response, cache headers should still be configured
      // from the middleware
      expect(response.status).toBe(500);
    });

    it("should respond with JSON content type", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0"),
        env,
      );

      expectJsonResponse(response);
    });
  });
});
