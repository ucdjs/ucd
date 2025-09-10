import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "hono";
import type { ClientErrorStatusCode, ServerErrorStatusCode } from "hono/utils/http-status";
import { ApiErrorSchema } from "./schemas.ts";

type HonoErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;

/**
 * Full response objects with content schemas for type inference.
 * Note: This differs from actual generated references (which only contain $ref).
 * @hono/zod-openapi requires full response objects for proper type inference.
 */
type GenerateReferencesOutput<TCodes extends readonly HonoErrorStatusCode[]> = {
  readonly [K in TCodes[number]]: {
    readonly content: {
      readonly "application/json": {
        readonly schema: typeof ApiErrorSchema;
      };
    };
    readonly description: string;
  };
};

const ERROR_DESCRIPTIONS = {
  400: "Bad request error",
  401: "Unauthorized error",
  403: "Forbidden error",
  404: "Resource not found",
  409: "Resource conflict",
  422: "Validation error",
  429: "Rate limit exceeded",
  500: "Internal server error",
  502: "Bad gateway - upstream service failed",
  503: "Service temporarily unavailable",
  504: "Gateway timeout",
} as const satisfies Partial<Record<HonoErrorStatusCode, string>>;

const RESPONSE_COMPONENT_NAMES = {
  400: "BadRequestError",
  401: "UnauthorizedError",
  403: "ForbiddenError",
  404: "NotFoundError",
  409: "ConflictError",
  422: "ValidationError",
  429: "TooManyRequestsError",
  500: "InternalServerError",
  502: "BadGatewayError",
  503: "ServiceUnavailableError",
  504: "GatewayTimeoutError",
} as const satisfies Partial<Record<HonoErrorStatusCode, string>>;

type SupportedStatusCode = keyof typeof ERROR_DESCRIPTIONS;

export interface ResponseComponentBuilder<TCodes extends readonly SupportedStatusCode[]> {
  /**
   * Registers error response components with the OpenAPI registry
   */
  registerApp: <TEnv extends Env>(app: OpenAPIHono<TEnv>) => void;

  /**
   * Generates response references for the specified status codes
   */
  generateReferences: <TProvidedCodes extends readonly NonNullable<TCodes[number]>[]>(codes: TProvidedCodes) => GenerateReferencesOutput<TProvidedCodes>;
}

/**
 * Validates that a status code is supported
 */
function validateStatusCode(statusCode?: HonoErrorStatusCode): statusCode is SupportedStatusCode {
  if (statusCode == null) {
    return false;
  }

  return statusCode in ERROR_DESCRIPTIONS && statusCode in RESPONSE_COMPONENT_NAMES;
}

/**
 * Creates a response component builder for managing OpenAPI error response schemas.
 *
 * This function provides a type-safe way to register and generate OpenAPI response components
 * for HTTP error status codes. It validates the provided status codes upfront and returns
 * a builder object with methods to register components and generate references.
 *
 * @template TCodes - Array of supported status codes that extends readonly SupportedStatusCode[]
 * @param codes - Array of HTTP error status codes to create response components for
 * @returns A ResponseComponentBuilder instance with registerApp and generateReferences methods
 *
 * @throws {Error} When an unsupported status code is provided
 *
 * @example
 * ```typescript
 * const builder = createResponseComponentBuilder([400, 401, 404] as const);
 *
 * // Register components with OpenAPI app
 * builder.registerApp(app);
 *
 * // Generate references for route definitions
 * const responses = builder.generateReferences([400, 404] as const);
 * ```
 */
export function createResponseComponentBuilder<TCodes extends readonly SupportedStatusCode[]>(
  codes: TCodes,
): ResponseComponentBuilder<TCodes> {
  // validate all codes upfront
  for (const code of codes) {
    if (!validateStatusCode(code)) {
      throw new Error(`Unsupported status code: ${code}`);
    }
  }

  return {
    registerApp<TEnv extends Env>(app: OpenAPIHono<TEnv>) {
      if (!app.openAPIRegistry) {
        throw new Error("OpenAPI registry is not initialized in the app");
      }

      // register the base ApiError schema if not already registered
      const hasApiError = app.openAPIRegistry.definitions.some(
        (d) => d.type === "component" && d.name === "ApiError",
      );

      if (!hasApiError) {
        app.openAPIRegistry.register("ApiError", ApiErrorSchema);
      }

      // register response components for each status code
      for (const statusCode of codes) {
        const componentName = RESPONSE_COMPONENT_NAMES[statusCode];
        const description = ERROR_DESCRIPTIONS[statusCode];

        const responseConfig = {
          description,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiError",
              },
              examples: {
                default: {
                  summary: ERROR_DESCRIPTIONS[statusCode],
                  value: {
                    status: statusCode,
                    message: description,
                    timestamp: new Date().toISOString(),
                  },
                },
              },
            },
          },
        } as const;

        app.openAPIRegistry.registerComponent("responses", componentName, responseConfig);
      }
    },

    generateReferences(codes) {
      const result = {} as GenerateReferencesOutput<TCodes>;

      for (const code of codes) {
        if (!validateStatusCode(code)) {
          throw new Error(`Unsupported status code: ${code}`);
        }

        const componentName = RESPONSE_COMPONENT_NAMES[code];

        // The "GenerateReferencesOutput" expects a full response object,
        // but since we registered them as components, we can reference them directly.
        // This works great! But if we didn't lie about the type, @hono/zod-openapi
        // would not be able to infer the responses.
        (result as any)[code] = {
          $ref: `#/components/responses/${componentName}`,
        };
      }

      return result;
    },
  };
}
