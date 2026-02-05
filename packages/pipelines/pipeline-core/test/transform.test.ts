import type {
  PipelineTransformDefinition,
  TransformContext,
} from "../src/transform";
import type { FileContext } from "../src/types";
import { describe, expect, it } from "vitest";
import {
  applyTransforms,
  definePipelineTransform,
} from "../src/transform";

function createTransformContext(): TransformContext {
  const file: FileContext = {
    version: "16.0.0",
    dir: "ucd",
    path: "ucd/LineBreak.txt",
    name: "LineBreak.txt",
    ext: ".txt",
  };

  return {
    version: "16.0.0",
    file,
  };
}

async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

async function collectAsync<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) {
    result.push(item);
  }
  return result;
}

describe("definePipelineTransform", () => {
  it("should define a simple transform", () => {
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
  });

  it("should define a transform with type parameters", () => {
    const transform = definePipelineTransform<string, number>({
      id: "string-length",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.length;
        }
      },
    });

    expect(transform.id).toBe("string-length");
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

    const ctx = createTransformContext();
    const input = createAsyncIterable([1, 2, 3]);
    const result = await collectAsync(transform.fn(ctx, input));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable(["hello", "world"]);
    const result = await collectAsync(applyTransforms(ctx, input, [uppercase]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable(["hello", "world"]);
    const result = await collectAsync(applyTransforms(ctx, input, [uppercase, exclaim]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable(["a", "ab", "abc"]);
    const result = await collectAsync(applyTransforms(ctx, input, [toLength, double]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable(["x"]);
    const result = await collectAsync(
      applyTransforms(ctx, input, [append("1"), append("2"), append("3")]),
    );

    expect(result).toEqual(["x123"]);
  });

  it("should handle empty transform array", async () => {
    const ctx = createTransformContext();
    const input = createAsyncIterable(["a", "b", "c"]);
    const result = await collectAsync(applyTransforms(ctx, input, []));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable<string>([]);
    const result = await collectAsync(applyTransforms(ctx, input, [uppercase]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable(["test"]);
    await collectAsync(applyTransforms(ctx, input, [captureContext]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable<Person>([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    const result = await collectAsync(applyTransforms(ctx, input, [addId]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable([1, 2, 3, 4, 5, 6]);
    const result = await collectAsync(applyTransforms(ctx, input, [filterEven]));

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

    const ctx = createTransformContext();
    const input = createAsyncIterable([1, 2, 3]);
    const result = await collectAsync(applyTransforms(ctx, input, [toArray]));

    expect(result).toEqual([[1, 2, 3]]);
  });
});

describe("type inference", () => {
  it("should preserve transform types", async () => {
    const stringToNumber = definePipelineTransform<string, number>({
      id: "length",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.length;
        }
      },
    });

    const ctx = createTransformContext();
    const input = createAsyncIterable(["hello", "world"]);
    const result = await collectAsync(stringToNumber.fn(ctx, input));

    expect(result).toEqual([5, 5]);
  });
});

describe("pipelineTransformDefinition", () => {
  it("should create valid transform definition", () => {
    const def: PipelineTransformDefinition<string, number> = {
      id: "test",
      async* fn(_ctx, rows) {
        for await (const row of rows) {
          yield row.length;
        }
      },
    };

    expect(def.id).toBe("test");
    expect(typeof def.fn).toBe("function");
  });
});
