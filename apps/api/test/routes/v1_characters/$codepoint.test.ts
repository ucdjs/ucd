import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import {
  expectApiError,
  expectJsonResponse,
} from "../../helpers/response";

describe("v1_characters", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/characters/{version}/{codepoint}", () => {
    describe("valid codepoint formats", () => {
      it("should accept U+XXXX format", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+0041"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0041 not yet available. API implementation pending.",
        });
      });

      it("should accept u+xxxx lowercase format", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/u+0041"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0041 not yet available. API implementation pending.",
        });
      });

      it("should accept 0xXX hexadecimal format", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/0x41"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0041 not yet available. API implementation pending.",
        });
      });

      it("should accept decimal format", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/65"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0041 not yet available. API implementation pending.",
        });
      });

      it("should accept single character", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/A"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0041 not yet available. API implementation pending.",
        });
      });

      it("should handle 6-digit Unicode codepoints", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+1F600"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+1F600 not yet available. API implementation pending.",
        });
      });

      it("should pad 4-digit codepoints correctly", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/0x41"),
          env,
        );

        expectJsonResponse(response);
        // Should pad to U+0041
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0041 not yet available. API implementation pending.",
        });
      });
    });

    describe("invalid codepoint formats", () => {
      it("should reject invalid U+ format", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+ZZZZ"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format/,
        });
      });

      it("should reject codepoint out of range (> 0x10FFFF)", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/1114112"), // 0x110000
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format/,
        });
      });

      it("should reject negative decimal values", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/-1"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format/,
        });
      });

      it("should reject multi-character strings", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/ABC"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format/,
        });
      });

      it("should reject malformed hex format", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/0xGHIJ"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format/,
        });
      });

      it("should reject random invalid string", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/invalid"),
          env,
        );

        await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format/,
        });
      });

      it("should provide helpful error message with examples", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/xyz"),
          env,
        );

        const error = await expectApiError(response, {
          status: 400,
          message: /Invalid codepoint format.*Use formats like U\+0041, 0x41, 65, or A/,
        });

        expect(error.message).toContain("xyz");
      });
    });

    describe("common characters", () => {
      it("should handle ASCII characters", async () => {
        const characters = ["A", "z", "0", "9", " ", "!"];

        for (const char of characters) {
          const { response } = await executeRequest(
            new Request(`https://api.ucdjs.dev/api/v1/characters/16.0.0/${char}`),
            env,
          );

          expectJsonResponse(response);
          expect(response.status).toBe(404);
        }
      });

      it("should handle emoji codepoints", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+1F603"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+1F603 not yet available. API implementation pending.",
        });
      });

      it("should handle CJK characters", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+4E00"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+4E00 not yet available. API implementation pending.",
        });
      });
    });

    describe("edge cases", () => {
      it("should handle null character (U+0000)", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+0000"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+0000 not yet available. API implementation pending.",
        });
      });

      it("should handle last valid Unicode codepoint (U+10FFFF)", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/U+10FFFF"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+10FFFF not yet available. API implementation pending.",
        });
      });

      it("should normalize codepoint case", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/characters/16.0.0/u+00e9"),
          env,
        );

        expectJsonResponse(response);
        // Should normalize to uppercase
        await expectApiError(response, {
          status: 404,
          message: "Character data for U+00E9 not yet available. API implementation pending.",
        });
      });
    });
  });
});
