/// <reference types="../../test-utils/src/matchers/types.d.ts" />

import { describe, expect, it } from "vitest";
import { ApiErrorSchema, UCDWellKnownConfigSchema } from "../src/api";

// eslint-disable-next-line test/prefer-lowercase-title
describe("ApiErrorSchema", () => {
  it("should validate a complete error object", () => {
    const validError = {
      message: "File not found",
      status: 404,
      timestamp: "2024-01-01T00:00:00Z",
    };

    expect(validError).toMatchSchema({
      schema: ApiErrorSchema,
      success: true,
      data: {
        message: "File not found",
        status: 404,
        timestamp: "2024-01-01T00:00:00Z",
      },
    });
  });

  it.each([
    { status: 400, expected: true },
    { status: 404, expected: true },
    { status: 500, expected: true },
    { status: 503, expected: true },
  ])("should validate different HTTP status codes: $status", ({ status, expected }) => {
    const apiError = {
      message: "Error",
      status,
      timestamp: "2024-01-01T00:00:00Z",
    };

    expect(apiError).toMatchSchema({
      schema: ApiErrorSchema,
      success: expected,
      data: {
        message: "Error",
        status,
        timestamp: "2024-01-01T00:00:00Z",
      },
    });
  });

  it("should reject missing required fields", () => {
    const invalidErrors = [
      { status: 404, timestamp: "2024-01-01T00:00:00Z" }, // missing message
      { message: "Error", timestamp: "2024-01-01T00:00:00Z" }, // missing status
      { message: "Error", status: 404 }, // missing timestamp
    ];

    for (const error of invalidErrors) {
      const result = ApiErrorSchema.safeParse(error);
      expect(result.success).toBe(false);
    }
  });

  it("should reject invalid types", () => {
    const invalidError = {
      message: 123, // should be string
      status: "404", // should be number
      timestamp: new Date(), // should be string
    };
    const result = ApiErrorSchema.safeParse(invalidError);
    expect(result.success).toBe(false);
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("UCDWellKnownConfigSchema", () => {
  it("should validate a complete config", () => {
    const validConfig = {
      version: "1.0",
      endpoints: {
        files: "/api/v1/files",
        manifest: "/.well-known/ucd-store/{version}.json",
        versions: "/api/v1/versions",
      },
      versions: ["16.0.0", "15.1.0", "15.0.0"],
    };
    expect(validConfig).toMatchSchema({
      schema: UCDWellKnownConfigSchema,
      success: true,
      data: {
        version: "1.0",
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store/{version}.json",
          versions: "/api/v1/versions",
        },
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      },
    });
  });

  it("should validate config with minimal data", () => {
    const minimalConfig = {
      endpoints: {
        files: "/api/v1/files",
        manifest: "/.well-known/ucd-store/{version}.json",
        versions: "/api/v1/versions",
      },
    };
    expect(minimalConfig).toMatchSchema({
      schema: UCDWellKnownConfigSchema,
      success: true,
      data: {
        version: "1.0", // default value
        versions: [], // default value
      },
    });
  });

  it("should validate config with empty versions", () => {
    const configWithEmptyVersions = {
      version: "1.0",
      endpoints: {
        files: "/api/v1/files",
        manifest: "/.well-known/ucd-store/{version}.json",
        versions: "/api/v1/versions",
      },
      versions: [],
    };
    expect(configWithEmptyVersions).toMatchSchema({
      schema: UCDWellKnownConfigSchema,
      success: true,
      data: {
        versions: [],
      },
    });
  });

  it("should reject missing endpoints", () => {
    const invalidConfig = {
      version: "1.0",
      versions: ["16.0.0"],
      // missing endpoints
    };
    expect(invalidConfig).toMatchSchema({
      schema: UCDWellKnownConfigSchema,
      success: false,
    });
  });

  it("should reject incomplete endpoints", () => {
    const invalidConfigs = [
      {
        endpoints: {
          files: "/api/v1/files",
          manifest: "/.well-known/ucd-store/{version}.json",
          // missing versions
        },
      },
      {
        endpoints: {
          files: "/api/v1/files",
          // missing manifest
          versions: "/api/v1/versions",
        },
      },
      {
        endpoints: {
          // missing files
          manifest: "/.well-known/ucd-store/{version}.json",
          versions: "/api/v1/versions",
        },
      },
    ];

    for (const config of invalidConfigs) {
      const result = UCDWellKnownConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    }
  });

  it("should reject invalid types", () => {
    const invalidConfig = {
      version: 1, // should be string
      endpoints: {
        files: "/api/v1/files",
        manifest: "/.well-known/ucd-store/{version}.json",
        versions: "/api/v1/versions",
      },
      versions: "16.0.0", // should be array
    };
    expect(invalidConfig).toMatchSchema({
      schema: UCDWellKnownConfigSchema,
      success: false,
    });
  });
});
