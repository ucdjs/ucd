import { dedent } from "@luxass/utils";
import { describe, expect, it } from "vitest";
import { buildInterface, buildStringArray } from "../src/knitwork";

describe("buildInterface", () => {
  it("generates a basic interface", () => {
    expect(buildInterface("Foo", { x: "string", y: "number" })).toBe(dedent`
      interface Foo {
        x: string;
        y: number;
      }
    `);
  });

  it("generates an exported interface", () => {
    expect(buildInterface("Foo", { x: "string" }, { export: true }))
      .toBe(dedent`
        export interface Foo {
          x: string;
        }
      `);
  });

  it("preserves union type syntax", () => {
    expect(buildInterface("Foo", { status: "\"active\" | \"inactive\"" }))
      .toBe(dedent`
        interface Foo {
          status: "active" | "inactive";
        }
      `);
  });

  it("generates an empty interface", () => {
    expect(buildInterface("Empty", {}))
      .toBe(dedent`
        interface Empty {

        }
      `);
  });
});

describe("buildStringArray", () => {
  it("generates a quoted string array literal", () => {
    expect(buildStringArray(["a", "b", "c"])).toBe(`["a", "b", "c"]`);
  });

  it("handles an empty array", () => {
    expect(buildStringArray([])).toBe("[]");
  });

  it("handles a single element", () => {
    expect(buildStringArray(["foo"])).toBe(`["foo"]`);
  });
});
