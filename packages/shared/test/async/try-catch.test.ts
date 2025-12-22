import { describe, expect, it } from "vitest";
import { wrapTry, tryOr } from "../../src/async/try-catch";

describe("tryCatch", () => {
  describe("synchronous operations", () => {
    it("should return success result for successful sync function", () => {
      const result = wrapTry(() => "success");

      expect(result).toEqual(["success", null]);
    });

    it("should return failure result for sync function that throws", () => {
      const result = wrapTry(() => {
        throw new Error("sync error");
      });

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("sync error");
    });

    it("should return success result for successful sync function with number", () => {
      const result = wrapTry(() => 42);

      expect(result).toEqual([42, null]);
    });

    it("should return success result for successful sync function with object", () => {
      const data = { foo: "bar" };
      const result = wrapTry(() => data);

      expect(result).toEqual([data, null]);
    });

    it("should convert non-Error thrown values to Error", () => {
      const result = wrapTry(() => {
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

      const result = await wrapTry(promise);

      expect(result).toEqual(["async success", null]);
    });

    it("should return failure result for rejected Promise", async () => {
      const promise = Promise.reject(new Error("async error"));

      const result = await wrapTry(promise);

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("async error");
    });

    it("should handle Promise that resolves with complex data", async () => {
      const data = { users: [{ id: 1, name: "John" }], count: 1 };
      const promise = Promise.resolve(data);

      const result = await wrapTry(promise);

      expect(result).toEqual([data, null]);
    });

    it("should convert non-Error rejection values to Error", async () => {
      // eslint-disable-next-line prefer-promise-reject-errors
      const promise = Promise.reject("async string error");

      const result = await wrapTry(promise);

      expect(result[1]).toBeInstanceOf(Error);
      expect(result[1]?.message).toBe("async string error");
    });
  });

  describe("asynchronous operations - function returning Promise", () => {
    it("should return success result for function returning resolved Promise", async () => {
      const result = await wrapTry(() => Promise.resolve("function promise success"));

      expect(result).toEqual(["function promise success", null]);
    });

    it("should return failure result for function returning rejected Promise", async () => {
      const result = await wrapTry(() => Promise.reject(new Error("function promise error")));

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("function promise error");
    });

    it("should handle async function", async () => {
      const result = await wrapTry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async function result";
      });

      expect(result).toEqual(["async function result", null]);
    });

    it("should handle async function that throws", async () => {
      const result = await wrapTry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("async function error");
      });

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("async function error");
    });

    it("should handle function that throws before returning Promise", () => {
      const result = wrapTry(() => {
        throw new Error("immediate error");
      });

      expect(result).toEqual([null, expect.any(Error)]);
      expect(result[1]?.message).toBe("immediate error");
    });
  });

  describe("edge cases", () => {
    it("should handle function returning undefined", () => {
      const result = wrapTry(() => undefined);

      expect(result).toEqual([undefined, null]);
    });

    it("should handle function returning null", () => {
      const result = wrapTry(() => null);

      expect(result).toEqual([null, null]);
    });

    it("should handle function returning false", () => {
      const result = wrapTry(() => false);

      expect(result).toEqual([false, null]);
    });

    it("should handle function returning empty string", () => {
      const result = wrapTry(() => "");

      expect(result).toEqual(["", null]);
    });

    it("should handle function returning zero", () => {
      const result = wrapTry(() => 0);

      expect(result).toEqual([0, null]);
    });
  });
});

describe("tryOr", () => {
  describe("synchronous operations", () => {
    it("should return success value for successful sync try with sync err", () => {
      const result = tryOr({
        try: () => ({ valid: "yes" }),
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when sync try throws", () => {
      const result = tryOr({
        try: () => {
          throw new Error("sync error");
        },
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ default: true });
    });

    it("should pass error to err handler", () => {
      let receivedError: unknown;
      const result = tryOr({
        try: () => {
          throw new Error("test error");
        },
        err: (error) => {
          receivedError = error;
          return { handled: true };
        },
      });

      expect(result).toEqual({ handled: true });
      expect(receivedError).toBeInstanceOf(Error);
      expect((receivedError as Error).message).toBe("test error");
    });

    it("should handle non-Error thrown values", () => {
      let receivedError: unknown;
      const result = tryOr({
        try: () => {
          // eslint-disable-next-line no-throw-literal
          throw "string error";
        },
        err: (error) => {
          receivedError = error;
          return { handled: true };
        },
      });

      expect(result).toEqual({ handled: true });
      expect(receivedError).toBe("string error");
    });
  });

  describe("asynchronous operations - Direct Promise", () => {
    it("should return success value for resolved Promise with sync err", async () => {
      const result = await tryOr({
        try: Promise.resolve({ valid: "yes" }),
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when Promise rejects with sync err", async () => {
      const result = await tryOr({
        try: Promise.reject(new Error("async error")),
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ default: true });
    });

    it("should return success value for resolved Promise with async err", async () => {
      const result = await tryOr({
        try: Promise.resolve({ valid: "yes" }),
        err: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { default: true };
        },
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when Promise rejects with async err", async () => {
      const result = await tryOr({
        try: Promise.reject(new Error("async error")),
        err: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { default: true };
        },
      });

      expect(result).toEqual({ default: true });
    });

    it("should pass error to async err handler", async () => {
      let receivedError: unknown;
      const result = await tryOr({
        try: Promise.reject(new Error("test error")),
        err: async (error) => {
          receivedError = error;
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { handled: true };
        },
      });

      expect(result).toEqual({ handled: true });
      expect(receivedError).toBeInstanceOf(Error);
      expect((receivedError as Error).message).toBe("test error");
    });
  });

  describe("asynchronous operations - function returning Promise", () => {
    it("should return success value for function returning resolved Promise with sync err", async () => {
      const result = await tryOr({
        try: () => Promise.resolve({ valid: "yes" }),
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when function returns rejected Promise with sync err", async () => {
      const result = await tryOr({
        try: () => Promise.reject(new Error("async error")),
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ default: true });
    });

    it("should return success value for async function with sync err", async () => {
      const result = await tryOr({
        try: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { valid: "yes" };
        },
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when async function throws with sync err", async () => {
      const result = await tryOr({
        try: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error("async error");
        },
        err: () => ({ default: true }),
      });

      expect(result).toEqual({ default: true });
    });

    it("should return success value for function returning Promise with async err", async () => {
      const result = await tryOr({
        try: () => Promise.resolve({ valid: "yes" }),
        err: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { default: true };
        },
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when function returns rejected Promise with async err", async () => {
      const result = await tryOr({
        try: () => Promise.reject(new Error("async error")),
        err: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { default: true };
        },
      });

      expect(result).toEqual({ default: true });
    });
  });

  describe("mixed sync/async operations", () => {
    it("should return success value for sync try with async err", async () => {
      const result = await tryOr({
        try: () => ({ valid: "yes" }),
        err: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { default: true };
        },
      });

      expect(result).toEqual({ valid: "yes" });
    });

    it("should return err value when sync try throws with async err", async () => {
      const result = await tryOr({
        try: () => {
          throw new Error("sync error");
        },
        err: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { default: true };
        },
      });

      expect(result).toEqual({ default: true });
    });
  });

  describe("error propagation", () => {
    it("should propagate error when err handler throws", () => {
      expect(() => {
        tryOr({
          try: () => {
            throw new Error("original error");
          },
          err: () => {
            throw new Error("err handler error");
          },
        });
      }).toThrow("err handler error");
    });

    it("should propagate error when async err handler throws", async () => {
      await expect(
        tryOr({
          try: () => {
            throw new Error("original error");
          },
          err: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error("async err handler error");
          },
        }),
      ).rejects.toThrow("async err handler error");
    });
  });

  describe("edge cases", () => {
    it("should handle function returning undefined", () => {
      const result = tryOr({
        try: () => undefined,
        err: () => ({ default: true }),
      });

      expect(result).toBeUndefined();
    });

    it("should handle function returning null", () => {
      const result = tryOr({
        try: () => null,
        err: () => ({ default: true }),
      });

      expect(result).toBeNull();
    });

    it("should handle function returning false", () => {
      const result = tryOr({
        try: () => false,
        err: () => true,
      });

      expect(result).toBe(false);
    });

    it("should handle function returning empty string", () => {
      const result = tryOr({
        try: () => "",
        err: () => "fallback",
      });

      expect(result).toBe("");
    });

    it("should handle function returning zero", () => {
      const result = tryOr({
        try: () => 0,
        err: () => -1,
      });

      expect(result).toBe(0);
    });

    it("should handle err returning undefined", () => {
      const result = tryOr({
        try: () => {
          throw new Error("error");
        },
        err: () => undefined,
      });

      expect(result).toBeUndefined();
    });

    it("should handle err returning null", () => {
      const result = tryOr({
        try: () => {
          throw new Error("error");
        },
        err: () => null,
      });

      expect(result).toBeNull();
    });
  });
});
