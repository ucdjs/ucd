import { assert, describe, expect, expectTypeOf, it } from "vitest";
import { tryCatch } from "../../src/async/try-catch";

describe("tryCatch", () => {
  describe("synchronous operations", () => {
    it("should return success result for successful sync function", () => {
      const result = tryCatch(() => "success");

      expect(result).toEqual(["success", null]);
    });

    it("should return failure result for sync function that throws", () => {
      const result = tryCatch(() => {
        throw new Error("sync error");
      });

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("sync error");
    });

    it("should return success result for successful sync function with number", () => {
      const result = tryCatch(() => 42);

      expect(result).toEqual([42, null]);
    });

    it("should return success result for successful sync function with object", () => {
      const data = { foo: "bar" };
      const result = tryCatch(() => data);

      expect(result).toEqual([data, null]);
    });

    it("should convert non-Error thrown values to Error", () => {
      const result = tryCatch(() => {
        // eslint-disable-next-line no-throw-literal
        throw "string error";
      });

      expect(result[1]).toBeInstanceOf(Error);
      expect(result[1]?.message).toBe("string error");
    });
  });

  describe("asynchronous operations - Promise input", () => {
    it("should return success result for resolved Promise", async () => {
      const promise = Promise.resolve("async success");

      const result = await tryCatch(promise);

      expect(result).toEqual(["async success", null]);
    });

    it("should return failure result for rejected Promise", async () => {
      const promise = Promise.reject(new Error("async error"));

      const result = await tryCatch(promise);

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("async error");
    });

    it("should handle Promise that resolves with complex data", async () => {
      const data = { users: [{ id: 1, name: "John" }], count: 1 };
      const promise = Promise.resolve(data);

      const result = await tryCatch(promise);

      expect(result).toEqual([data, null]);
    });

    it("should convert non-Error rejection values to Error", async () => {
      // eslint-disable-next-line prefer-promise-reject-errors
      const promise = Promise.reject("async string error");

      const result = await tryCatch(promise);

      expect(result[1]).toBeInstanceOf(Error);
      expect(result[1]?.message).toBe("async string error");
    });
  });

  describe("asynchronous operations - function returning Promise", () => {
    it("should return success result for function returning resolved Promise", async () => {
      const result = await tryCatch(() => Promise.resolve("function promise success"));

      expect(result).toEqual(["function promise success", null]);
    });

    it("should return failure result for function returning rejected Promise", async () => {
      const result = await tryCatch(() => Promise.reject(new Error("function promise error")));

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("function promise error");
    });

    it("should handle async function", async () => {
      const result = await tryCatch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async function result";
      });

      expect(result).toEqual(["async function result", null]);
    });

    it("should handle async function that throws", async () => {
      const result = await tryCatch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("async function error");
      });

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("async function error");
    });

    it("should handle function that throws before returning Promise", () => {
      const result = tryCatch(() => {
        throw new Error("immediate error");
      });

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("immediate error");
    });
  });

  describe("type inference", () => {
    it("should maintain proper type inference for success results", () => {
      const operation = () => ({ id: 1, name: "test" });

      const result = tryCatch(operation);

      // TypeScript should infer the correct types
      if (result[1] === null) {
        expect(result[0].id).toBe(1);
        expect(result[0].name).toBe("test");
      }
    });

    it("should handle generic types correctly", async () => {
      interface User {
        id: number;
        name: string;
      }

      const [data, error] = tryCatch(() => {
        return { id: 1, name: "John" } satisfies User;
      });

      assert(error == null, "Expected no error");

      expect(data).toEqual({ id: 1, name: "John" });
      expectTypeOf(data).toEqualTypeOf<User>();
    });
  });

  describe("edge cases", () => {
    it("should handle function returning undefined", () => {
      const result = tryCatch(() => undefined);

      expect(result).toEqual([undefined, null]);
    });

    it("should handle function returning null", () => {
      const result = tryCatch(() => null);

      expect(result).toEqual([null, null]);
    });

    it("should handle function returning false", () => {
      const result = tryCatch(() => false);

      expect(result).toEqual([false, null]);
    });

    it("should handle function returning empty string", () => {
      const result = tryCatch(() => "");

      expect(result).toEqual(["", null]);
    });

    it("should handle function returning zero", () => {
      const result = tryCatch(() => 0);

      expect(result).toEqual([0, null]);
    });
  });
});
