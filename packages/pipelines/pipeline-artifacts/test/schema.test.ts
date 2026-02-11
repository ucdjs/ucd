import type {
  Artifact,
  ArtifactDefinition,
  GlobalArtifact,
  InferArtifactSchemaType,
  InferEmittedArtifacts,
} from "../src/schema";
import { assert, describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  artifact,
  isGlobalArtifact,
  isVersionArtifact,
} from "../src/schema";

describe("artifact", () => {
  it("should create version artifact by default", () => {
    const schema = z.string();
    const result = artifact(schema);

    expect(result).toEqual({
      _type: "artifact",
      schema,
      scope: "version",
    });
  });

  it("should create version artifact when explicitly specified", () => {
    const schema = z.number();
    const result = artifact(schema, "version");

    expect(result).toEqual({
      _type: "artifact",
      schema,
      scope: "version",
    });
  });

  it("should create global artifact when scope is global", () => {
    const schema = z.boolean();
    const result = artifact(schema, "global");

    expect(result).toEqual({
      _type: "global-artifact",
      schema,
      scope: "global",
    });
  });

  it("should work with complex schemas", () => {
    const schema = z.object({
      id: z.string(),
      count: z.number(),
      metadata: z.record(z.string(), z.unknown()),
    });
    const result = artifact(schema, "version");

    expect(result.schema).toBe(schema);
    expect(result.scope).toBe("version");
  });

  it("should work with array schemas", () => {
    const schema = z.array(z.string());
    const result = artifact(schema);

    expect(result.schema).toBe(schema);
    expect(result._type).toBe("artifact");
  });

  it("should work with union schemas", () => {
    const schema = z.union([z.string(), z.number()]);
    const result = artifact(schema, "global");

    expect(result.schema).toBe(schema);
    expect(result._type).toBe("global-artifact");
  });
});

describe("isGlobalArtifact", () => {
  it("should return true for global artifacts", () => {
    const schema = z.string();
    const globalArt: ArtifactDefinition = {
      _type: "global-artifact",
      schema,
      scope: "global",
    };

    expect(isGlobalArtifact(globalArt)).toBe(true);
  });

  it("should return false for version artifacts", () => {
    const schema = z.string();
    const versionArt = artifact(schema, "version");

    expect(isGlobalArtifact(versionArt)).toBe(false);
  });

  it("should work as type guard", () => {
    const schema = z.object({ value: z.string() });
    const art: ArtifactDefinition = artifact(schema, "global");

    assert(isGlobalArtifact(art));
    expect(art._type).toBe("global-artifact");
    expect(art.scope).toBe("global");
    expectTypeOf(art).toEqualTypeOf<GlobalArtifact>();
  });
});

describe("isVersionArtifact", () => {
  it("should return true for version artifacts", () => {
    const schema = z.number();
    const versionArt: Artifact = {
      _type: "artifact",
      schema,
      scope: "version",
    };

    expect(isVersionArtifact(versionArt)).toBe(true);
  });

  it("should return false for global artifacts", () => {
    const schema = z.number();
    const globalArt: GlobalArtifact = {
      _type: "global-artifact",
      schema,
      scope: "global",
    };

    expect(isVersionArtifact(globalArt)).toBe(false);
  });

  it("should work as type guard", () => {
    const schema = z.object({ count: z.number() });
    const art: ArtifactDefinition = artifact(schema, "version");

    assert(isVersionArtifact(art));
    expect(art._type).toBe("artifact");
    expect(art.scope).toBe("version");
    expectTypeOf(art).toEqualTypeOf<Artifact>();
  });
});

describe("type inference", () => {
  describe("inferArtifactSchemaType", () => {
    it("should infer schema type correctly", () => {
      const schema = z.object({
        id: z.string(),
        count: z.number(),
      });
      // eslint-disable-next-line unused-imports/no-unused-vars
      const art = artifact(schema);

      type Inferred = InferArtifactSchemaType<typeof art>;

      expectTypeOf<Inferred>().toEqualTypeOf<{ id: string; count: number }>();
    });

    it("should work with primitive types", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const stringArt = artifact(z.string());
      type StringType = InferArtifactSchemaType<typeof stringArt>;

      expectTypeOf<StringType>().toEqualTypeOf<string>();
    });
  });

  describe("inferEmittedArtifacts", () => {
    it("should infer multiple artifact types", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const emits = {
        result: artifact(z.object({ value: z.string() })),
        count: artifact(z.number()),
        enabled: artifact(z.boolean()),
      } as const;

      type Inferred = InferEmittedArtifacts<typeof emits>;

      expectTypeOf<Inferred>().toEqualTypeOf<{
        readonly result: { value: string };
        readonly count: number;
        readonly enabled: boolean;
      }>();
    });

    it("should work with global and version artifacts", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const emits = {
        global: artifact(z.string(), "global"),
        version: artifact(z.number(), "version"),
      } as const;

      type Inferred = InferEmittedArtifacts<typeof emits>;

      expectTypeOf<Inferred>().toEqualTypeOf<{
        readonly global: string;
        readonly version: number;
      }>();
    });

    it("should work with complex nested schemas", () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const emits = {
        data: artifact(
          z.object({
            items: z.array(z.string()),
            metadata: z.record(z.string(), z.unknown()),
          }),
        ),
      } as const;

      type Inferred = InferEmittedArtifacts<typeof emits>;

      expectTypeOf<Inferred>().toEqualTypeOf<{
        readonly data: {
          items: string[];
          metadata: Record<string, unknown>;
        };
      }>();
    });
  });
});

describe("schema validation", () => {
  it("should validate data with artifact schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const art = artifact(schema);

    const validData = { name: "John", age: 30 };
    const result = art.schema.parse(validData);

    expect(result).toEqual(validData);
  });

  it("should reject invalid data", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const art = artifact(schema);

    const invalidData = { name: "John", age: "thirty" };
    const result = art.schema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  it("should work with optional fields", () => {
    const schema = z.object({
      required: z.string(),
      optional: z.number().optional(),
    });
    const art = artifact(schema);

    const data1 = { required: "test" };
    const data2 = { required: "test", optional: 42 };

    expect(art.schema.safeParse(data1).success).toBe(true);
    expect(art.schema.safeParse(data2).success).toBe(true);
  });
});
