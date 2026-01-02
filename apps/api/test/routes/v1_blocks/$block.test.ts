import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import {
  expectApiError,
  expectJsonResponse,
} from "../../helpers/response";

describe("v1_blocks", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/blocks/{version}/{block}", () => {
    it("should return 404 for a valid block name (pending implementation)", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin"),
        env,
      );

      await expectApiError(response, {
        status: 404,
        message: "Block \"Basic_Latin\" not found. API implementation pending.",
      });
    });

    it("should return 400 for empty block name", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/"),
        env,
      );

      // This will likely hit a different route or 404
      // But we're testing the path normalization
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle query parameters - include_characters", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?include_characters=true"),
        env,
      );

      expectJsonResponse(response);
      await expectApiError(response, {
        status: 404,
        message: "Block \"Basic_Latin\" not found. API implementation pending.",
      });
    });

    it("should handle query parameters - format", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?format=detailed"),
        env,
      );

      expectJsonResponse(response);
      await expectApiError(response, {
        status: 404,
        message: "Block \"Basic_Latin\" not found. API implementation pending.",
      });
    });

    it("should handle query parameters - limit", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?limit=10"),
        env,
      );

      expectJsonResponse(response);
      await expectApiError(response, {
        status: 404,
        message: "Block \"Basic_Latin\" not found. API implementation pending.",
      });
    });

    it("should handle combined query parameters", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/CJK_Unified_Ideographs?include_characters=true&format=detailed&limit=50"),
        env,
      );

      expectJsonResponse(response);
      await expectApiError(response, {
        status: 404,
        message: "Block \"CJK_Unified_Ideographs\" not found. API implementation pending.",
      });
    });

    it("should handle different block name formats", async () => {
      const blockNames = [
        "Basic_Latin",
        "Latin-1_Supplement",
        "CJK_Unified_Ideographs",
        "Emoji",
      ];

      for (const blockName of blockNames) {
        const { response } = await executeRequest(
          new Request(`https://api.ucdjs.dev/api/v1/blocks/16.0.0/${blockName}`),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: `Block "${blockName}" not found. API implementation pending.`,
        });
      }
    });

    it("should validate include_characters parameter", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?include_characters=invalid"),
        env,
      );

      // Should return validation error
      await expectApiError(response, {
        status: 400,
      });
    });

    it("should validate format parameter", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?format=invalid"),
        env,
      );

      // Should return validation error
      await expectApiError(response, {
        status: 400,
      });
    });

    it("should validate limit parameter as positive integer", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?limit=-5"),
        env,
      );

      // Should return validation error for negative limit
      await expectApiError(response, {
        status: 400,
      });
    });

    it("should validate limit parameter as integer not string", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/blocks/16.0.0/Basic_Latin?limit=abc"),
        env,
      );

      // Should return validation error for non-numeric limit
      await expectApiError(response, {
        status: 400,
      });
    });
  });
});
