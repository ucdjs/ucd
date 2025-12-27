import { describe, expectTypeOf, it } from "vitest";
import { tryOr, wrapTry } from "../../src/async/try-catch";

describe("wrapTry - type inference", () => {
  it("should infer correct return type for sync operation", () => {
    const result = wrapTry(() => "success");

    expectTypeOf(result).toEqualTypeOf<readonly [string, null] | readonly [null, Error]>();
  });

  it("should infer correct return type for async operation", async () => {
    const result = await wrapTry(async () => {
      await Promise.resolve();
      return "async success";
    });

    expectTypeOf(result).toEqualTypeOf<readonly [string, null] | readonly [null, Error]>();
  });

  it("should infer correct return type for Promise input", async () => {
    const result = await wrapTry(Promise.resolve(42));

    expectTypeOf(result).toEqualTypeOf<readonly [number, null] | readonly [null, Error]>();
  });

  it("should maintain proper type inference for success results", () => {
    const operation = () => ({ id: 1, name: "test" });

    const result = wrapTry(operation);

    expectTypeOf(result).toEqualTypeOf<
      readonly [{ id: number; name: string }, null] | readonly [null, Error]
    >();

    // TypeScript should infer the correct types
    if (result[1] === null) {
      expectTypeOf(result[0]).toEqualTypeOf<{ id: number; name: string }>();
    }
  });

  it("should handle generic types correctly", () => {
    interface User {
      id: number;
      name: string;
    }

    const [data, error] = wrapTry(() => {
      return { id: 1, name: "John" } satisfies User;
    });

    expectTypeOf(data).toEqualTypeOf<User | null>();
    expectTypeOf(error).toEqualTypeOf<Error | null>();

    if (error === null) {
      expectTypeOf(data).toEqualTypeOf<User>();
    }
  });

  it("should infer error type parameter", () => {
    class CustomError extends Error {}

    const result = wrapTry<number, CustomError>(() => {
      throw new CustomError("custom");
    });

    expectTypeOf(result).toExtend<readonly [number, null] | readonly [null, CustomError]>();
  });
});

describe("tryOr - type inference", () => {
  it("should infer union type for sync try + sync err", () => {
    const result = tryOr({
      try: () => ({ valid: "yes" }),
      err: () => ({ default: true }),
    });

    expectTypeOf(result).toEqualTypeOf<{ valid: string } | { default: boolean }>();
  });

  it("should infer Promise union type for async try + sync err", () => {
    const result = tryOr({
      try: async () => {
        await Promise.resolve();
        return { valid: "yes" };
      },
      err: () => ({ default: true }),
    });

    expectTypeOf(result).toEqualTypeOf<Promise<{ valid: string } | { default: boolean }>>();
  });

  it("should infer Promise union type for sync try + async err", () => {
    const result = tryOr({
      try: () => ({ valid: "yes" }),
      err: async () => {
        await Promise.resolve();
        return { default: true };
      },
    });

    expectTypeOf(result).toEqualTypeOf<Promise<{ valid: string } | { default: boolean }>>();
  });

  it("should infer Promise union type for async try + async err", () => {
    const result = tryOr({
      try: async () => {
        await Promise.resolve();
        return { valid: "yes" };
      },
      err: async () => {
        await Promise.resolve();
        return { default: true };
      },
    });

    expectTypeOf(result).toEqualTypeOf<Promise<{ valid: string } | { default: boolean }>>();
  });

  it("should infer Promise union type for direct Promise try", () => {
    const result = tryOr({
      try: Promise.resolve({ valid: "yes" }),
      err: () => ({ default: true }),
    });

    expectTypeOf(result).toEqualTypeOf<
      Promise<{ valid: string } | { default: boolean }>
    >();
  });

  it("should maintain proper type inference for success results", () => {
    const result = tryOr({
      try: () => ({ id: 1, name: "test" }),
      err: () => ({ default: true }),
    });

    expectTypeOf(result).toEqualTypeOf<{
      default: boolean;
    } | {
      id: number;
      name: string;
    }>();
  });

  it("should handle generic types correctly", () => {
    interface Config {
      valid: string;
    }

    interface DefaultConfig {
      default: boolean;
    }

    const result = tryOr({
      try: () => ({ valid: "yes" } as Config),
      err: () => ({ default: true } as DefaultConfig),
    });

    expectTypeOf(result).toEqualTypeOf<Config | DefaultConfig>();
  });

  it("should handle async operations with proper type inference", () => {
    interface Data {
      value: number;
    }

    interface Fallback {
      fallback: true;
    }

    const result = tryOr({
      try: async () => {
        await Promise.resolve();
        return { value: 42 } as Data;
      },
      err: () => ({ fallback: true } as Fallback),
    });

    expectTypeOf(result).toEqualTypeOf<Promise<Data | Fallback>>();
  });

  it("should infer primitive types correctly", () => {
    const stringResult = tryOr({
      try: () => "success",
      err: () => "fallback",
    });

    expectTypeOf(stringResult).toEqualTypeOf<string>();

    const numberResult = tryOr({
      try: () => 42,
      err: () => 0,
    });

    expectTypeOf(numberResult).toEqualTypeOf<number>();

    const booleanResult = tryOr({
      try: () => true,
      err: () => false,
    });

    expectTypeOf(booleanResult).toEqualTypeOf<boolean>();
  });

  it("should handle null and undefined types", () => {
    const nullResult = tryOr({
      try: () => null,
      err: () => ({ default: true }),
    });

    expectTypeOf(nullResult).toEqualTypeOf<null | { default: boolean }>();

    const undefinedResult = tryOr({
      try: () => undefined,
      err: () => ({ default: true }),
    });

    expectTypeOf(undefinedResult).toEqualTypeOf<undefined | { default: boolean }>();
  });

  it("should handle array types", () => {
    const result = tryOr({
      try: () => [1, 2, 3],
      err: () => [],
    });

    expectTypeOf(result).toEqualTypeOf<number[]>();
  });

  it("should handle function types", () => {
    const result = tryOr({
      try: () => (x: number) => x * 2,
      err: () => (x: number) => x,
    });

    expectTypeOf(result).toEqualTypeOf<((x: number) => number)>();
  });

  it("should handle complex nested types", () => {
    interface Nested {
      level1: {
        level2: {
          value: string;
        };
      };
    }

    interface Fallback {
      error: true;
    }

    const result = tryOr({
      try: () => ({
        level1: {
          level2: {
            value: "deep",
          },
        },
      } as Nested),
      err: () => ({ error: true } as Fallback),
    });

    expectTypeOf(result).toEqualTypeOf<Fallback | Nested>();
  });
});
