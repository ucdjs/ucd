import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResponseComponentBuilder } from "../src/openapi";
import { ApiErrorSchema } from "../src/schemas";

const VALID_CLIENT_ERROR_CODES = [400, 401, 403, 404, 409, 422, 429] as const;
const VALID_SERVER_ERROR_CODES = [500, 502, 503, 504] as const;
const ALL_VALID_CODES = [
  ...VALID_CLIENT_ERROR_CODES,
  ...VALID_SERVER_ERROR_CODES,
] as const;
const INVALID_CODES = [200, 300, 999, 123] as const;

function createMockApp() {
  return {
    openAPIRegistry: {
      definitions: [] as Array<{ type: string; name: string }>,
      register: vi.fn(),
      registerComponent: vi.fn(),
    },
  } as unknown as OpenAPIHono<Env>;
}

function expectComponentRegistration(
  mockApp: ReturnType<typeof createMockApp>,
  componentName: string,
  description: string,
) {
  expect(mockApp.openAPIRegistry.registerComponent).toHaveBeenCalledWith(
    "responses",
    componentName,
    {
      description,
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ApiError",
          },
        },
      },
    },
  );
}

describe("createResponseComponentBuilder", () => {
  let mockApp: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = createMockApp();
  });

  describe("initialization and validation", () => {
    it("should create builder successfully with valid status codes", () => {
      expect(() => createResponseComponentBuilder([400, 404, 500])).not.toThrow();
    });

    it("should throw descriptive error for unsupported status codes", () => {
      const [invalidCode] = INVALID_CODES;
      expect(() => createResponseComponentBuilder([invalidCode] as any)).toThrow(
        `Unsupported status code: ${invalidCode}`,
      );
    });

    it("should validate all codes and throw for first invalid one", () => {
      const [firstInvalid, secondInvalid] = INVALID_CODES;
      expect(() => createResponseComponentBuilder([400, firstInvalid, secondInvalid] as any)).toThrow(
        `Unsupported status code: ${firstInvalid}`,
      );
    });

    it("should reject all invalid status codes", () => {
      INVALID_CODES.forEach((invalidCode) => {
        expect(() => createResponseComponentBuilder([invalidCode] as any)).toThrow(
          `Unsupported status code: ${invalidCode}`,
        );
      });
    });

    it("should accept all supported error codes", () => {
      expect(() => createResponseComponentBuilder(ALL_VALID_CODES)).not.toThrow();
    });

    it("should work with empty array", () => {
      expect(() => createResponseComponentBuilder([])).not.toThrow();
    });
  });

  describe("registerApp method", () => {
    it("should throw when OpenAPI registry is missing", () => {
      const builder = createResponseComponentBuilder([400]);
      const appWithoutRegistry = {} as OpenAPIHono<Env>;

      expect(() => builder.registerApp(appWithoutRegistry)).toThrow(
        "OpenAPI registry is not initialized in the app",
      );
    });

    it("should register ApiError schema when not present", () => {
      const builder = createResponseComponentBuilder([400]);

      builder.registerApp(mockApp);

      expect(mockApp.openAPIRegistry.register).toHaveBeenCalledWith("ApiError", ApiErrorSchema);
    });

    it("should skip ApiError schema registration when already present", () => {
      mockApp.openAPIRegistry.definitions.push({
        type: "component",
        name: "ApiError",
        component: {
          schema: {},
        },
        componentType: "schemas",
      });
      const builder = createResponseComponentBuilder([400]);

      builder.registerApp(mockApp);

      expect(mockApp.openAPIRegistry.register).not.toHaveBeenCalled();
    });

    it("should register response components for all provided codes", () => {
      const codes = [400, 404, 500] as const;
      const builder = createResponseComponentBuilder(codes);

      builder.registerApp(mockApp);

      expect(mockApp.openAPIRegistry.registerComponent).toHaveBeenCalledTimes(3);
      expectComponentRegistration(mockApp, "BadRequestError", "Bad request error");
      expectComponentRegistration(mockApp, "NotFoundError", "Resource not found");
      expectComponentRegistration(mockApp, "InternalServerError", "Internal server error");
    });

    it("should handle single status code registration", () => {
      const builder = createResponseComponentBuilder([422]);

      builder.registerApp(mockApp);

      expectComponentRegistration(mockApp, "ValidationError", "Validation error");
    });

    it("should handle empty codes array", () => {
      const builder = createResponseComponentBuilder([]);

      builder.registerApp(mockApp);

      expect(mockApp.openAPIRegistry.register).toHaveBeenCalledWith("ApiError", ApiErrorSchema);
      expect(mockApp.openAPIRegistry.registerComponent).not.toHaveBeenCalled();
    });
  });

  describe("generateReferences method", () => {
    it("should generate correct references for given codes", () => {
      const builder = createResponseComponentBuilder([400, 404, 500]);

      const references = builder.generateReferences([400, 404]);

      expect(references).toEqual({
        400: { $ref: "#/components/responses/BadRequestError" },
        404: { $ref: "#/components/responses/NotFoundError" },
      });
    });

    it("should generate reference for single code", () => {
      const builder = createResponseComponentBuilder([401]);

      const references = builder.generateReferences([401]);

      expect(references).toEqual({
        401: { $ref: "#/components/responses/UnauthorizedError" },
      });
    });

    it("should return empty object for empty codes array", () => {
      const builder = createResponseComponentBuilder([400]);

      const references = builder.generateReferences([]);

      expect(references).toEqual({});
    });

    it("should generate references for all error types", () => {
      const testCases = [
        { code: 400, component: "BadRequestError" },
        { code: 401, component: "UnauthorizedError" },
        { code: 403, component: "ForbiddenError" },
        { code: 404, component: "NotFoundError" },
        { code: 409, component: "ConflictError" },
        { code: 422, component: "ValidationError" },
        { code: 429, component: "TooManyRequestsError" },
        { code: 500, component: "InternalServerError" },
        { code: 502, component: "BadGatewayError" },
        { code: 503, component: "ServiceUnavailableError" },
        { code: 504, component: "GatewayTimeoutError" },
      ] as const;

      testCases.forEach(({ code, component }) => {
        const builder = createResponseComponentBuilder([code]);
        const references = builder.generateReferences([code]);

        expect(references[code]).toEqual({
          $ref: `#/components/responses/${component}`,
        });
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle typical REST API setup", () => {
      const restCodes = [400, 401, 403, 404, 422, 500] as const;
      const builder = createResponseComponentBuilder(restCodes);

      builder.registerApp(mockApp);
      const references = builder.generateReferences([400, 404, 500]);

      expect(mockApp.openAPIRegistry.registerComponent).toHaveBeenCalledTimes(6);
      expect(references).toEqual({
        400: { $ref: "#/components/responses/BadRequestError" },
        404: { $ref: "#/components/responses/NotFoundError" },
        500: { $ref: "#/components/responses/InternalServerError" },
      });
    });

    it("should handle microservice gateway scenarios", () => {
      const gatewayCodes = [502, 503, 504] as const;
      const builder = createResponseComponentBuilder(gatewayCodes);

      builder.registerApp(mockApp);
      const references = builder.generateReferences(gatewayCodes);

      expect(references).toEqual({
        502: { $ref: "#/components/responses/BadGatewayError" },
        503: { $ref: "#/components/responses/ServiceUnavailableError" },
        504: { $ref: "#/components/responses/GatewayTimeoutError" },
      });
    });

    it("should work with rate-limited APIs", () => {
      const builder = createResponseComponentBuilder([429]);

      builder.registerApp(mockApp);
      const references = builder.generateReferences([429]);

      expectComponentRegistration(mockApp, "TooManyRequestsError", "Rate limit exceeded");
      expect(references[429]).toEqual({
        $ref: "#/components/responses/TooManyRequestsError",
      });
    });

    it("should support full workflow with all codes", () => {
      const builder = createResponseComponentBuilder(ALL_VALID_CODES);

      // should register without errors
      expect(() => builder.registerApp(mockApp)).not.toThrow();

      // should register all components
      expect(mockApp.openAPIRegistry.registerComponent).toHaveBeenCalledTimes(ALL_VALID_CODES.length);

      // should generate all references
      const allReferences = builder.generateReferences(ALL_VALID_CODES);
      expect(Object.keys(allReferences)).toHaveLength(ALL_VALID_CODES.length);

      expect(
        // @ts-expect-error - $ref is the only property there, the entire type is a lie.
        allReferences[400].$ref,
      ).toBe("#/components/responses/BadRequestError");
      expect(
        // @ts-expect-error - $ref is the only property there, the entire type is a lie.
        allReferences[500].$ref,
      ).toBe("#/components/responses/InternalServerError");
    });
  });

  describe("type safety and constraints", () => {
    it("should maintain type safety for status codes", () => {
      const builder = createResponseComponentBuilder([400, 404] as const);

      const subset = builder.generateReferences([400] as const);
      const all = builder.generateReferences([400, 404] as const);

      expect(subset[400]).toBeDefined();
      expect(all[400]).toBeDefined();
      expect(all[404]).toBeDefined();
    });

    it("should work with readonly arrays", () => {
      const codes = [400, 500] as const;
      const builder = createResponseComponentBuilder(codes);

      expect(() => builder.registerApp(mockApp)).not.toThrow();
      expect(() => builder.generateReferences(codes)).not.toThrow();
    });
  });
});
