import { describe, expect, it } from "vitest";
import {
  createArtifactDependency,
  createRouteDependency,
  isArtifactDependency,
  isRouteDependency,
  parseDependency,
  type ExtractArtifactDependencies,
  type ExtractArtifactKeys,
  type ExtractRouteDependencies,
  type ParsedArtifactDependency,
  type ParsedDependency,
  type ParsedRouteDependency,
  type PipelineDependency,
} from "../src/dependencies";

describe("parseDependency", () => {
  it("should parse route dependency", () => {
    const result = parseDependency("route:my-route");

    expect(result).toEqual({
      type: "route",
      routeId: "my-route",
    });
  });

  it("should parse artifact dependency", () => {
    const result = parseDependency("artifact:my-route:my-artifact");

    expect(result).toEqual({
      type: "artifact",
      routeId: "my-route",
      artifactName: "my-artifact",
    });
  });

  it("should parse route with hyphens and underscores", () => {
    const result = parseDependency("route:unicode-data_processor");

    expect(result).toEqual({
      type: "route",
      routeId: "unicode-data_processor",
    });
  });

  it("should parse artifact with complex names", () => {
    const result = parseDependency("artifact:data-processor:normalized_output");

    expect(result).toEqual({
      type: "artifact",
      routeId: "data-processor",
      artifactName: "normalized_output",
    });
  });

  it("should throw error for invalid format", () => {
    expect(() => parseDependency("invalid" as PipelineDependency)).toThrow(
      'Invalid dependency format: invalid. Expected "route:<id>" or "artifact:<routeId>:<artifactName>"',
    );
  });

  it("should throw error for route without id", () => {
    expect(() => parseDependency("route:" as PipelineDependency)).toThrow(
      'Invalid dependency format: route:',
    );
  });

  it("should throw error for artifact without name", () => {
    expect(() => parseDependency("artifact:my-route:" as PipelineDependency)).toThrow(
      'Invalid dependency format: artifact:my-route:',
    );
  });

  it("should throw error for artifact without route id", () => {
    expect(() => parseDependency("artifact::my-artifact" as PipelineDependency)).toThrow(
      'Invalid dependency format: artifact::my-artifact',
    );
  });

  it("should throw error for unknown dependency type", () => {
    expect(() => parseDependency("unknown:value" as PipelineDependency)).toThrow(
      'Invalid dependency format: unknown:value',
    );
  });
});

describe("isRouteDependency", () => {
  it("should return true for route dependency", () => {
    expect(isRouteDependency("route:my-route")).toBe(true);
  });

  it("should return false for artifact dependency", () => {
    expect(isRouteDependency("artifact:route:artifact")).toBe(false);
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

describe("isArtifactDependency", () => {
  it("should return true for artifact dependency", () => {
    expect(isArtifactDependency("artifact:route:artifact")).toBe(true);
  });

  it("should return false for route dependency", () => {
    expect(isArtifactDependency("route:my-route")).toBe(false);
  });

  it("should work as type guard", () => {
    const dep: PipelineDependency = "artifact:route:artifact" as const;

    if (isArtifactDependency(dep)) {
      expect(dep).toBe("artifact:route:artifact");
    } else {
      throw new Error("Expected artifact dependency");
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

describe("createArtifactDependency", () => {
  it("should create artifact dependency", () => {
    const dep = createArtifactDependency("my-route", "my-artifact");

    expect(dep).toBe("artifact:my-route:my-artifact");
  });

  it("should create artifact dependency with complex names", () => {
    const dep = createArtifactDependency("data-processor", "normalized_output");

    expect(dep).toBe("artifact:data-processor:normalized_output");
  });

  it("should be parseable", () => {
    const dep = createArtifactDependency("test-route", "test-artifact");
    const parsed = parseDependency(dep);

    expect(parsed).toEqual({
      type: "artifact",
      routeId: "test-route",
      artifactName: "test-artifact",
    });
  });
});

describe("ParsedDependency types", () => {
  it("should handle route dependency types", () => {
    const parsed: ParsedRouteDependency = {
      type: "route",
      routeId: "my-route",
    };

    expect(parsed.type).toBe("route");
    expect(parsed.routeId).toBe("my-route");
  });

  it("should handle artifact dependency types", () => {
    const parsed: ParsedArtifactDependency = {
      type: "artifact",
      routeId: "my-route",
      artifactName: "my-artifact",
    };

    expect(parsed.type).toBe("artifact");
    expect(parsed.routeId).toBe("my-route");
    expect(parsed.artifactName).toBe("my-artifact");
  });

  it("should handle union type correctly", () => {
    const routeDep: ParsedDependency = {
      type: "route",
      routeId: "test",
    };

    const artifactDep: ParsedDependency = {
      type: "artifact",
      routeId: "test",
      artifactName: "artifact",
    };

    expect(routeDep.type).toBe("route");
    expect(artifactDep.type).toBe("artifact");
  });
});

describe("type inference", () => {
  describe("ExtractRouteDependencies", () => {
    it("should extract route ids from dependency array", () => {
      const deps = [
        "route:parser",
        "route:normalizer",
        "artifact:other:data",
      ] as const;

      type RouteIds = ExtractRouteDependencies<typeof deps>;

      const id1: RouteIds = "parser";
      const id2: RouteIds = "normalizer";

      expect(id1).toBe("parser");
      expect(id2).toBe("normalizer");
    });

    it("should extract never type for empty array", () => {
      const deps = [] as const;

      type RouteIds = ExtractRouteDependencies<typeof deps>;

      const neverValue: RouteIds = undefined as never;
      expect(neverValue).toBeUndefined();
    });
  });

  describe("ExtractArtifactDependencies", () => {
    it("should extract artifact info from dependency array", () => {
      const deps = [
        "artifact:parser:result",
        "artifact:normalizer:data",
        "route:other",
      ] as const;

      type ArtifactDeps = ExtractArtifactDependencies<typeof deps>;

      const dep1: ArtifactDeps = { routeId: "parser", artifactName: "result" };
      const dep2: ArtifactDeps = { routeId: "normalizer", artifactName: "data" };

      expect(dep1).toEqual({ routeId: "parser", artifactName: "result" });
      expect(dep2).toEqual({ routeId: "normalizer", artifactName: "data" });
    });
  });

  describe("ExtractArtifactKeys", () => {
    it("should extract artifact keys from dependency array", () => {
      const deps = [
        "artifact:parser:result",
        "artifact:normalizer:data",
        "route:other",
      ] as const;

      type ArtifactKeys = ExtractArtifactKeys<typeof deps>;

      const key1: ArtifactKeys = "parser:result";
      const key2: ArtifactKeys = "normalizer:data";

      expect(key1).toBe("parser:result");
      expect(key2).toBe("normalizer:data");
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

  it("should roundtrip artifact dependency", () => {
    const original = createArtifactDependency("test-route", "test-artifact");
    const parsed = parseDependency(original);

    if (parsed.type === "artifact") {
      const reconstructed = createArtifactDependency(
        parsed.routeId,
        parsed.artifactName,
      );
      expect(reconstructed).toBe(original);
    } else {
      throw new Error("Expected artifact dependency");
    }
  });
});
