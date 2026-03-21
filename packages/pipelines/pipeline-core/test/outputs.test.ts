import type { RouteOutputPathContext } from "../src/outputs/types";
import { describe, expect, it } from "vitest";
import {
  getOutputProperty,
  renderOutputPathTemplate,
  resolveOutputDestination,
  serializeOutputValue,
} from "../src/outputs";

function createPathContext(overrides: Partial<RouteOutputPathContext> = {}): RouteOutputPathContext {
  return {
    version: "16.0.0",
    routeId: "scripts",
    file: {
      version: "16.0.0",
      dir: "ucd",
      path: "ucd/Scripts.txt",
      name: "Scripts.txt",
      ext: ".txt",
    },
    output: { property: "Script_Extensions" },
    property: "Script_Extensions",
    outputIndex: 0,
    ...overrides,
  };
}

describe("renderOutputPathTemplate", () => {
  it("renders version and kebab property", () => {
    const result = renderOutputPathTemplate(
      "preview/{version}/{property:kebab}.json",
      createPathContext(),
    );
    expect(result).toBe("preview/16.0.0/script-extensions.json");
  });

  it("renders lower-cased property", () => {
    const result = renderOutputPathTemplate(
      "{property:lower}.json",
      createPathContext({ property: "General_Category" }),
    );
    expect(result).toBe("general_category.json");
  });

  it("renders file.name token", () => {
    const result = renderOutputPathTemplate(
      "{routeId}/{file.name}",
      createPathContext(),
    );
    expect(result).toBe("scripts/Scripts.txt");
  });

  it("replaces unknown tokens with empty string", () => {
    const result = renderOutputPathTemplate(
      "{unknown}/test.json",
      createPathContext(),
    );
    expect(result).toBe("/test.json");
  });
});

describe("resolveOutputDestination", () => {
  it("resolves memory locator when no sink is provided", () => {
    const result = resolveOutputDestination(
      { id: "preview", format: "json", path: "preview/{version}/{property:kebab}.json" },
      createPathContext(),
    );
    expect(result).toEqual({
      locator: "memory://preview/16.0.0/script-extensions.json",
      displayLocator: "memory://preview/16.0.0/script-extensions.json",
    });
  });

  it("falls back to default path when no path is defined", () => {
    const result = resolveOutputDestination(
      { id: "default", format: "json" },
      createPathContext(),
    );
    expect(result).toEqual({
      locator: "memory://scripts/script-extensions-0.json",
      displayLocator: "memory://scripts/script-extensions-0.json",
    });
  });

  it("resolves filesystem sink with baseDir", () => {
    const result = resolveOutputDestination(
      { id: "fs", format: "json", path: "data.json", sink: { type: "filesystem", baseDir: "/out" } },
      createPathContext(),
    );
    expect(result).toEqual({
      locator: "/out/data.json",
      displayLocator: "/out/data.json",
    });
  });

  it("uses resolvePath when provided", () => {
    const result = resolveOutputDestination(
      { id: "fs", format: "json", path: "data.json", sink: { type: "filesystem", baseDir: "/out" } },
      createPathContext(),
      (base, rel) => `${base}/${rel}`.replace("//", "/"),
    );
    expect(result).toEqual({
      locator: "/out/data.json",
      displayLocator: "/out/data.json",
    });
  });

  it("supports function path resolver", () => {
    const result = resolveOutputDestination(
      { id: "fn", format: "json", path: (ctx) => `custom/${ctx.routeId}.json` },
      createPathContext(),
    );
    expect(result).toEqual({
      locator: "memory://custom/scripts.json",
      displayLocator: "memory://custom/scripts.json",
    });
  });
});

describe("serializeOutputValue", () => {
  it("serializes json format", () => {
    const result = serializeOutputValue({ hello: "world" }, "json");
    expect(JSON.parse(result)).toEqual({ hello: "world" });
  });

  it("returns string directly for text format", () => {
    expect(serializeOutputValue("plain text", "text")).toBe("plain text");
  });

  it("serializes non-string values as json for text format", () => {
    const result = serializeOutputValue({ value: "x" }, "text");
    expect(result).toContain("\"value\"");
  });
});

describe("getOutputProperty", () => {
  it("extracts property from object", () => {
    expect(getOutputProperty({ property: "Script" })).toBe("Script");
  });

  it("returns undefined for non-object", () => {
    expect(getOutputProperty("string")).toBeUndefined();
    expect(getOutputProperty(null)).toBeUndefined();
    expect(getOutputProperty(undefined)).toBeUndefined();
  });

  it("returns undefined when no property field", () => {
    expect(getOutputProperty({ other: "field" })).toBeUndefined();
  });
});
