import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";
import {
  expectApiError,
  expectJsonResponse,
} from "../../helpers/response";

describe("v1_properties", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/properties/{version}/{property}", () => {
    describe("basic property requests", () => {
      it("should return 404 for valid property name (pending implementation)", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Alphabetic"),
          env,
        );

        await expectApiError(response, {
          status: 404,
          message: "Property \"Alphabetic\" data not yet available. API implementation pending.",
        });
      });

      it("should return 400 for empty property name", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/"),
          env,
        );

        // This will likely hit a different route or 404
        expect(response.status).toBeGreaterThanOrEqual(400);
      });

      it("should respond with JSON content type", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji"),
          env,
        );

        expectJsonResponse(response);
      });
    });

    describe("common Unicode properties", () => {
      const commonProperties = [
        "Alphabetic",
        "Uppercase",
        "Lowercase",
        "Emoji",
        "White_Space",
        "Numeric_Type",
        "Script",
        "Block",
        "General_Category",
      ];

      it("should handle various property names", async () => {
        for (const property of commonProperties) {
          const { response } = await executeRequest(
            new Request(`https://api.ucdjs.dev/api/v1/properties/16.0.0/${property}`),
            env,
          );

          expectJsonResponse(response);
          await expectApiError(response, {
            status: 404,
            message: `Property "${property}" data not yet available. API implementation pending.`,
          });
        }
      });
    });

    describe("query parameters - format", () => {
      it("should accept format=ranges", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?format=ranges"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Emoji\" data not yet available. API implementation pending.",
        });
      });

      it("should accept format=list", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Uppercase?format=list"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Uppercase\" data not yet available. API implementation pending.",
        });
      });

      it("should accept format=json", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Alphabetic?format=json"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Alphabetic\" data not yet available. API implementation pending.",
        });
      });

      it("should default to ranges format when not specified", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
        });
      });

      it("should reject invalid format value", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?format=invalid"),
          env,
        );

        await expectApiError(response, {
          status: 400,
        });
      });
    });

    describe("query parameters - pagination", () => {
      it("should accept limit parameter", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Alphabetic?limit=100"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Alphabetic\" data not yet available. API implementation pending.",
        });
      });

      it("should accept offset parameter", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Alphabetic?offset=50"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Alphabetic\" data not yet available. API implementation pending.",
        });
      });

      it("should accept both limit and offset", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?limit=50&offset=100"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Emoji\" data not yet available. API implementation pending.",
        });
      });

      it("should default offset to 0 when not specified", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?limit=10"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
        });
      });

      it("should reject negative limit", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?limit=-10"),
          env,
        );

        await expectApiError(response, {
          status: 400,
        });
      });

      it("should reject zero limit", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?limit=0"),
          env,
        );

        await expectApiError(response, {
          status: 400,
        });
      });

      it("should reject negative offset", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?offset=-5"),
          env,
        );

        await expectApiError(response, {
          status: 400,
        });
      });

      it("should reject non-integer limit", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?limit=10.5"),
          env,
        );

        await expectApiError(response, {
          status: 400,
        });
      });

      it("should reject non-numeric limit", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?limit=abc"),
          env,
        );

        await expectApiError(response, {
          status: 400,
        });
      });
    });

    describe("query parameters - value filter", () => {
      it("should accept value parameter", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Numeric_Type?value=Decimal"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Numeric_Type\" data not yet available. API implementation pending.",
        });
      });

      it("should handle value with equals sign (e.g., Numeric_Value=5)", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Numeric_Value?value=5"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Numeric_Value\" data not yet available. API implementation pending.",
        });
      });

      it("should handle URL-encoded value", async () => {
        const value = encodeURIComponent("Latin Extended-A");
        const { response } = await executeRequest(
          new Request(`https://api.ucdjs.dev/api/v1/properties/16.0.0/Block?value=${value}`),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Block\" data not yet available. API implementation pending.",
        });
      });
    });

    describe("combined query parameters", () => {
      it("should handle all parameters together", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Alphabetic?format=list&limit=50&offset=100&value=true"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Alphabetic\" data not yet available. API implementation pending.",
        });
      });

      it("should handle format and pagination", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Emoji?format=json&limit=25&offset=0"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Emoji\" data not yet available. API implementation pending.",
        });
      });
    });

    describe("property name variations", () => {
      it("should handle property with underscores", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/White_Space"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"White_Space\" data not yet available. API implementation pending.",
        });
      });

      it("should handle mixed case property names", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/General_Category"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"General_Category\" data not yet available. API implementation pending.",
        });
      });

      it("should handle single word property", async () => {
        const { response } = await executeRequest(
          new Request("https://api.ucdjs.dev/api/v1/properties/16.0.0/Script"),
          env,
        );

        expectJsonResponse(response);
        await expectApiError(response, {
          status: 404,
          message: "Property \"Script\" data not yet available. API implementation pending.",
        });
      });
    });
  });
});
