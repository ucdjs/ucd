import type { UCDClient } from "../src";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createUCDClientWithConfig } from "../src";

type HttpMethod
  = | "get"
    | "put"
    | "post"
    | "delete"
    | "patch"
    | "head"
    | "options"
    | "trace";

interface UCDOpenAPIOperation {
  "operationId"?: string;
  "deprecated"?: boolean;
  "x-ucd-client-method"?: string;
  "x-ucd-no-client"?: boolean;
}

interface UCDOpenAPIPathItem {
  [method: string]: UCDOpenAPIOperation | unknown;
}

interface UCDOpenAPISpec {
  paths: Record<string, UCDOpenAPIPathItem>;
}

interface OpenAPIOperationEntry {
  path: string;
  method: HttpMethod;
  operation: UCDOpenAPIOperation;
}

const HTTP_METHODS = new Set<HttpMethod>([
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "head",
  "options",
  "trace",
]);

function loadOpenAPISpec(): UCDOpenAPISpec {
  const openApiPath = fileURLToPath(new URL("../../../ucd-generated/api/openapi.json", import.meta.url));
  return JSON.parse(readFileSync(openApiPath, "utf8")) as UCDOpenAPISpec;
}

function getOperations(spec: UCDOpenAPISpec): OpenAPIOperationEntry[] {
  const operations: OpenAPIOperationEntry[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method as HttpMethod)) {
        continue;
      }

      operations.push({
        path,
        method: method as HttpMethod,
        operation: operation as UCDOpenAPIOperation,
      });
    }
  }

  return operations;
}

function createClient(): UCDClient {
  return createUCDClientWithConfig("https://api.ucdjs.dev", {
    version: "0.1",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/api/v1/versions/{version}/manifest",
      reports: "/api/v1/reports",
      versions: "/api/v1/versions",
    },
    versions: [],
  });
}

function resolveClientMethod(client: UCDClient, methodPath: string): unknown {
  return methodPath
    .split(".")
    .reduce<unknown>((current, segment) => {
      if (current == null || typeof current !== "object") {
        return undefined;
      }

      return Reflect.get(current, segment);
    }, client);
}

describe("openAPI client coverage", () => {
  it("assigns a unique operationId to every OpenAPI operation", () => {
    const operations = getOperations(loadOpenAPISpec());
    const operationIds = new Set<string>();

    for (const { path, method, operation } of operations) {
      const { operationId } = operation;

      expect(operationId, `${method.toUpperCase()} ${path} is missing operationId`).toBeTruthy();

      if (!operationId) {
        continue;
      }

      expect(operationIds.has(operationId), `Duplicate operationId ${operationId}`).toBe(false);
      operationIds.add(operationId);
    }
  });

  it("maps every required OpenAPI operation to a real client method", () => {
    const client = createClient();
    const operations = getOperations(loadOpenAPISpec());

    for (const { path, method, operation } of operations) {
      if (operation["x-ucd-no-client"] === true) {
        expect(
          operation["x-ucd-client-method"],
          `${method.toUpperCase()} ${path} opts out of client coverage but still declares a client method`,
        ).toBeUndefined();
        continue;
      }

      const clientMethodPath = operation["x-ucd-client-method"];
      expect(
        clientMethodPath,
        `${method.toUpperCase()} ${path} is missing x-ucd-client-method`,
      ).toBeTruthy();

      if (!clientMethodPath) {
        continue;
      }

      const resolvedMethod = resolveClientMethod(client, clientMethodPath);

      expect(
        typeof resolvedMethod,
        `${method.toUpperCase()} ${path} points to missing client method ${clientMethodPath}`,
      ).toBe("function");
    }
  });
});
