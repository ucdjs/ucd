import type {
  ExtractRouteDependencies,
  ParsedDependency,
  ParsedRouteDependency,
  PipelineDependency,
} from "../src/dependencies";
import { describe, expect, it } from "vitest";
import {
  createRouteDependency,
  isRouteDependency,
  parseDependency,
} from "../src/dependencies";

describe("parseDependency", () => {
  it("should parse route dependency", () => {
    const result = parseDependency("route:my-route");

    expect(result).toEqual({
      type: "route",
      routeId: "my-route",
    });
  });

  it("should parse route with hyphens and underscores", () => {
    const result = parseDependency("route:unicode-data_processor");

    expect(result).toEqual({
      type: "route",
      routeId: "unicode-data_processor",
    });
  });

  it("should throw error for invalid format", () => {
    expect(() => parseDependency("invalid" as PipelineDependency)).toThrow(
      "Invalid dependency format: invalid. Expected \"route:<id>\"",
    );
  });

  it("should throw error for route without id", () => {
    expect(() => parseDependency("route:" as PipelineDependency)).toThrow(
      "Invalid route dependency format: route:. Expected \"route:<id>\" with non-empty id",
    );
  });

  it("should throw error for unknown dependency type", () => {
    expect(() => parseDependency("unknown:value" as PipelineDependency)).toThrow(
      "Invalid dependency format: unknown:value",
    );
  });
});

describe("isRouteDependency", () => {
  it("should return true for route dependency", () => {
    expect(isRouteDependency("route:my-route")).toBe(true);
  });

  it("should work as type guard", () => {
    const dep: PipelineDependency = "route:test" as const;

    if (isRouteDependency(dep)) {
      expect(dep).toBe("route:test");
    } else {
      throw new Error("Expected route dependency");
    }
  });
});

describe("createRouteDependency", () => {
  it("should create route dependency", () => {
    const dep = createRouteDependency("my-route");

    expect(dep).toBe("route:my-route");
  });

  it("should create route dependency with complex id", () => {
    const dep = createRouteDependency("unicode-data_processor");

    expect(dep).toBe("route:unicode-data_processor");
  });

  it("should be parseable", () => {
    const dep = createRouteDependency("test-route");
    const parsed = parseDependency(dep);

    expect(parsed).toEqual({
      type: "route",
      routeId: "test-route",
    });
  });
});

describe("parsedDependency types", () => {
  it("should handle route dependency types", () => {
    const parsed: ParsedRouteDependency = {
      type: "route",
      routeId: "my-route",
    };

    expect(parsed.type).toBe("route");
    expect(parsed.routeId).toBe("my-route");
  });

  it("should handle union type correctly", () => {
    const routeDep: ParsedDependency = {
      type: "route",
      routeId: "test",
    };

    expect(routeDep.type).toBe("route");
  });
});

describe("type inference", () => {
  describe("extractRouteDependencies", () => {
    it("should extract route ids from dependency array", () => {
      type RouteIds = ExtractRouteDependencies<[
        "route:parser",
        "route:normalizer",
      ]>;

      const id1: RouteIds = "parser";
      const id2: RouteIds = "normalizer";

      expect(id1).toBe("parser");
      expect(id2).toBe("normalizer");
    });

    it("should extract never type for empty array", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const deps = [] as const;

      type RouteIds = ExtractRouteDependencies<typeof deps>;

      const neverValue: RouteIds = undefined as never;
      expect(neverValue).toBeUndefined();
    });
  });
});

describe("roundtrip parsing", () => {
  it("should roundtrip route dependency", () => {
    const original = createRouteDependency("test-route");
    const parsed = parseDependency(original);
    const reconstructed = createRouteDependency(parsed.routeId);

    expect(reconstructed).toBe(original);
  });
});
