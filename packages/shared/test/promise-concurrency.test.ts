import { describe, expect, it, vi } from "vitest";
import { createConcurrencyLimiter } from "../src/async/promise-concurrency";

describe("createConcurrencyLimiter", () => {
  it("should throw error for invalid concurrency values", () => {
    expect(() => createConcurrencyLimiter(0)).toThrow("Concurrency must be a positive integer");
    expect(() => createConcurrencyLimiter(-1)).toThrow("Concurrency must be a positive integer");
    expect(() => createConcurrencyLimiter(1.5)).toThrow("Concurrency must be a positive integer");
    expect(() => createConcurrencyLimiter(Number.NaN)).toThrow("Concurrency must be a positive integer");
  });

  it("should accept valid positive integer concurrency values", () => {
    expect(() => createConcurrencyLimiter(1)).not.toThrow();
    expect(() => createConcurrencyLimiter(5)).not.toThrow();
    expect(() => createConcurrencyLimiter(100)).not.toThrow();
    expect(() => createConcurrencyLimiter(Number.POSITIVE_INFINITY)).not.toThrow();
  });

  it("should limit concurrent executions", async () => {
    const limiter = createConcurrencyLimiter(2);
    let activeCount = 0;
    let maxConcurrent = 0;

    const slowTask = async (id: number) => {
      activeCount++;
      maxConcurrent = Math.max(maxConcurrent, activeCount);
      await new Promise((resolve) => setTimeout(resolve, 50));
      activeCount--;
      return id;
    };

    const tasks = Array.from({ length: 5 }, (_, i) => limiter(slowTask, i));
    const results = await Promise.all(tasks);

    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(maxConcurrent).toBe(2);
  });

  it("should handle synchronous functions", async () => {
    const limiter = createConcurrencyLimiter(1);
    const syncFn = (x: number) => x * 2;

    const result = await limiter(syncFn, 5);

    expect(result).toBe(10);
  });

  it("should handle functions that return promises", async () => {
    const limiter = createConcurrencyLimiter(1);
    const asyncFn = async (x: number) => x * 3;

    const result = await limiter(asyncFn, 4);

    expect(result).toBe(12);
  });

  it("should handle function rejections properly", async () => {
    const limiter = createConcurrencyLimiter(1);
    const rejectingFn = async () => {
      throw new Error("Test error");
    };

    await expect(limiter(rejectingFn)).rejects.toThrow("Test error");
  });

  it("should continue processing queue after rejection", async () => {
    const limiter = createConcurrencyLimiter(1);
    const successFn = vi.fn().mockResolvedValue("success");
    const rejectingFn = async () => {
      throw new Error("Test error");
    };

    const tasks = [
      limiter(rejectingFn).catch((e) => e.message),
      limiter(successFn),
      limiter(successFn),
    ];

    const results = await Promise.all(tasks);

    expect(results[0]).toBe("Test error");
    expect(results[1]).toBe("success");
    expect(results[2]).toBe("success");
    expect(successFn).toHaveBeenCalledTimes(2);
  });

  it("should maintain execution order within concurrency limit", async () => {
    const limiter = createConcurrencyLimiter(1);
    const executionOrder: number[] = [];

    const task = async (id: number) => {
      executionOrder.push(id);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return id;
    };

    const tasks = [
      limiter(task, 1),
      limiter(task, 2),
      limiter(task, 3),
    ];

    await Promise.all(tasks);

    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it("should handle high concurrency limits", async () => {
    const limiter = createConcurrencyLimiter(1000);
    const tasks = Array.from({ length: 10 }, (_, i) =>
      limiter(async (x: number) => x, i));

    const results = await Promise.all(tasks);

    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("should handle functions with no arguments", async () => {
    const limiter = createConcurrencyLimiter(1);
    const result = await limiter(() => "no args");

    expect(result).toBe("no args");
  });

  it("should handle functions with multiple arguments", async () => {
    const limiter = createConcurrencyLimiter(1);

    const result = await limiter(
      (a: number, b: string, c: boolean) => ({ a, b, c }),
      42,
      "test",
      true,
    );

    expect(result).toEqual({ a: 42, b: "test", c: true });
  });

  it("should properly clean up queue when all tasks complete", async () => {
    const limiter = createConcurrencyLimiter(1);
    let taskCount = 0;

    const task = async () => {
      taskCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return taskCount;
    };

    // run first batch
    await Promise.all([limiter(task), limiter(task), limiter(task)]);

    // run second batch to ensure queue is properly reset
    const results = await Promise.all([limiter(task), limiter(task)]);

    expect(results).toEqual([4, 5]);
  });

  it("starts queued tasks FIFO with concurrency=2", async () => {
    const limiter = createConcurrencyLimiter(2);
    const starts: number[] = [];
    const mk = (id: number, delay: number) => limiter(async () => {
      starts.push(id);
      await new Promise((r) => setTimeout(r, delay));
      return id;
    });

    await Promise.all([mk(1, 30), mk(2, 30), mk(3, 0), mk(4, 0)]);
    // first two start immediately (1,2), then 3, then 4.
    expect(starts).toEqual([1, 2, 3, 4]);
  });
});
