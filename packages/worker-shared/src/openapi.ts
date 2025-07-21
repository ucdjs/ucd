import type { OpenAPIHono, RouteConfig } from "@hono/zod-openapi";
import type { ClientErrorStatusCode, ServerErrorStatusCode } from "hono/utils/http-status";
import { ApiErrorSchema } from "./schemas";

type HonoErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;
type AstreaResponseObject = RouteConfig["responses"];
type AstreaResponseType = AstreaResponseObject[keyof AstreaResponseObject];

const ERROR_DESCRIPTIONS: Partial<Record<HonoErrorStatusCode, string>> = {
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
};

const RESPONSE_COMPONENT_NAMES: Partial<Record<HonoErrorStatusCode, string>> = {
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
};

export interface ResponseComponentBuilder<TCodes extends HonoErrorStatusCode[]> {
  registerApp: (app: OpenAPIHono<any>) => void;
  generateReferences: (codes: TCodes) => Record<string, AstreaResponseType>;
}

export function createResponseComponentBuilder<TCodes extends HonoErrorStatusCode[]>(
  codes: TCodes,
): ResponseComponentBuilder<TCodes> {
  return {
    registerApp(app: OpenAPIHono<any>) {
      if (!app.openAPIRegistry) {
        throw new Error("OpenAPI registry is not initialized in the app");
      }

      if (!app.openAPIRegistry.definitions.find((d) => d.type === "component" && d.name === "ApiError")) {
        app.openAPIRegistry.register("ApiError", ApiErrorSchema);
      }

      for (const statusCode of codes) {
        const componentName = RESPONSE_COMPONENT_NAMES[statusCode];
        const description = ERROR_DESCRIPTIONS[statusCode];

        if (!componentName) {
          throw new Error(`No component name defined for status code ${statusCode}`);
        }

        if (!description) {
          throw new Error(`No description defined for status code ${statusCode}`);
        }

        const responseConfig = {
          description,
          content: {
            "application/json": {
              schema: {
                type: "object",
                $ref: "#/components/schemas/ApiError",
              },
            },
          },
        };

        app.openAPIRegistry.registerComponent("responses", componentName, responseConfig);
      }
    },

    generateReferences(codes: TCodes) {
      const references: Record<string, AstreaResponseType> = {};
      for (const statusCode of codes) {
        const componentName = RESPONSE_COMPONENT_NAMES[statusCode];
        if (componentName) {
          references[statusCode] = {
            $ref: `#/components/responses/${componentName}`,
          };
        }
      }

      return references;
    },
  };
}
