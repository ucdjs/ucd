import type { PipelineTransformDefinition } from "../src/transform";
import { asyncFromArray, collect } from "#test-utils";
import { describe, expect, expectTypeOf, it } from "vitest";
import { applyTransforms, definePipelineTransform } from "../src/transform";

describe("definePipelineTransform", () => {
  it("should define a simple transform", async () => {
    const transform = definePipelineTransform({
      id: "uppercase",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield (row as string).toUpperCase();
        }
      },
    });

    expect(transform.id).toBe("uppercase");
    expect(typeof transform.fn).toBe("function");
    expectTypeOf(transform).toEqualTypeOf<PipelineTransformDefinition<unknown, string>>();

    const input = ["a", "b", "c"];
    const result = await collect(
      transform.fn(null as any, asyncFromArray(input)),
    );

    expect(result).toEqual(["A", "B", "C"]);
  });

  it("should define a transform with type parameters", async () => {
    const transform = definePipelineTransform<string, number>({
      id: "string-length",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.length;
        }
      },
    });

    expect(transform.id).toBe("string-length");
    expectTypeOf(transform).toEqualTypeOf<PipelineTransformDefinition<string, number>>();

    const input = ["foo", "barbaz"];
    const result = await collect(
      transform.fn(null as any, asyncFromArray(input)),
    );

    expect(result).toEqual([3, 6]);
  });

  it("should preserve transform function", async () => {
    const transform = definePipelineTransform<number, number>({
      id: "double",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row * 2;
        }
      },
    });

    expectTypeOf(transform).toEqualTypeOf<PipelineTransformDefinition<number, number>>();

    const input = [1, 2, 3];
    const result = await collect(
      transform.fn(null as any, asyncFromArray(input)),
    );
    expectTypeOf(result).toEqualTypeOf<number[]>();

    expect(result).toEqual([2, 4, 6]);
  });
});

describe("applyTransforms", () => {
  it("should apply single transform", async () => {
    const uppercase = definePipelineTransform<string, string>({
      id: "uppercase",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.toUpperCase();
        }
      },
    });

    expectTypeOf(uppercase).toEqualTypeOf<PipelineTransformDefinition<string, string>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray(["hello", "world"]), [uppercase]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual(["HELLO", "WORLD"]);
  });

  it("should chain multiple transforms", async () => {
    const uppercase = definePipelineTransform<string, string>({
      id: "uppercase",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.toUpperCase();
        }
      },
    });

    const exclaim = definePipelineTransform<string, string>({
      id: "exclaim",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield `${row}!`;
        }
      },
    });

    expectTypeOf(uppercase).toEqualTypeOf<PipelineTransformDefinition<string, string>>();
    expectTypeOf(exclaim).toEqualTypeOf<PipelineTransformDefinition<string, string>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray(["hello", "world"]), [uppercase, exclaim]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual(["HELLO!", "WORLD!"]);
  });

  it("should handle type transformations", async () => {
    const toLength = definePipelineTransform<string, number>({
      id: "to-length",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.length;
        }
      },
    });

    const double = definePipelineTransform<number, number>({
      id: "double",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row * 2;
        }
      },
    });

    expectTypeOf(toLength).toEqualTypeOf<PipelineTransformDefinition<string, number>>();
    expectTypeOf(double).toEqualTypeOf<PipelineTransformDefinition<number, number>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray(["a", "ab", "abc"]), [toLength, double]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual([2, 4, 6]);
  });

  it("should apply transforms in order", async () => {
    const append = (suffix: string) =>
      definePipelineTransform<string, string>({
        id: `append-${suffix}`,
        async* fn(_ctx, rows) {
          for await (const row of rows) {
            yield `${row}${suffix}`;
          }
        },
      });

    const t1 = append("1");
    const t2 = append("2");
    const t3 = append("3");
    expectTypeOf(t1).toEqualTypeOf<PipelineTransformDefinition<string, string>>();
    expectTypeOf(t2).toEqualTypeOf<PipelineTransformDefinition<string, string>>();
    expectTypeOf(t3).toEqualTypeOf<PipelineTransformDefinition<string, string>>();

    const ctx = {} as any;
    const result = await collect(
      applyTransforms(ctx, asyncFromArray(["x"]), [t1, t2, t3]),
    );

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual(["x123"]);
  });

  it("should handle empty transform array", async () => {
    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray(["a", "b", "c"]), []));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual(["a", "b", "c"]);
  });

  it("should handle empty input", async () => {
    const uppercase = definePipelineTransform<string, string>({
      id: "uppercase",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.toUpperCase();
        }
      },
    });

    expectTypeOf(uppercase).toEqualTypeOf<PipelineTransformDefinition<string, string>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray<string>([]), [uppercase]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual([]);
  });

  it("should pass context to transforms", async () => {
    let capturedVersion: string | undefined;
    let capturedFileName: string | undefined;

    const captureContext = definePipelineTransform<string, string>({
      id: "capture",
      async* fn(ctx, rows) {
        capturedVersion = ctx.version;
        capturedFileName = ctx.file.name;
        for await (const row of rows) {
          yield row;
        }
      },
    });

    expectTypeOf(captureContext).toEqualTypeOf<PipelineTransformDefinition<string, string>>();

    const ctx = {
      version: "16.0.0",
      file: {
        version: "16.0.0",
        dir: "ucd",
        path: "ucd/LineBreak.txt",
        name: "LineBreak.txt",
        ext: ".txt",
      },
    };
    await collect(applyTransforms(ctx, asyncFromArray(["test"]), [captureContext]));

    expect(capturedVersion).toBe("16.0.0");
    expect(capturedFileName).toBe("LineBreak.txt");
  });

  it("should handle object transformations", async () => {
    interface Person {
      name: string;
      age: number;
    }

    interface PersonWithId extends Person {
      id: string;
    }

    const addId = definePipelineTransform<Person, PersonWithId>({
      id: "add-id",
      async* fn(_ctx, rows) {
        let counter = 0;
        for await (const row of rows) {
          yield { ...row, id: `person-${counter++}` };
        }
      },
    });

    expectTypeOf(addId).toEqualTypeOf<PipelineTransformDefinition<Person, PersonWithId>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray<Person>([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]), [addId]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual([
      { name: "Alice", age: 30, id: "person-0" },
      { name: "Bob", age: 25, id: "person-1" },
    ]);
  });

  it("should handle filter transformations", async () => {
    const filterEven = definePipelineTransform<number, number>({
      id: "filter-even",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          if (row % 2 === 0) {
            yield row;
          }
        }
      },
    });

    expectTypeOf(filterEven).toEqualTypeOf<PipelineTransformDefinition<number, number>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray([1, 2, 3, 4, 5, 6]), [filterEven]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual([2, 4, 6]);
  });

  it("should handle aggregation transformations", async () => {
    const toArray = definePipelineTransform<number, number[]>({
      id: "to-array",
      async* fn(_ctx, rows) {
        const arr: number[] = [];
        for await (const row of rows) {
          arr.push(row);
        }
        yield arr;
      },
    });

    expectTypeOf(toArray).toEqualTypeOf<PipelineTransformDefinition<number, number[]>>();

    const ctx = {} as any;
    const result = await collect(applyTransforms(ctx, asyncFromArray([1, 2, 3]), [toArray]));

    expectTypeOf(result).toEqualTypeOf<unknown[]>();

    expect(result).toEqual([[1, 2, 3]]);
  });
});
