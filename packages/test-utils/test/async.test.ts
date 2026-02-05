import { describe, expect, it } from "vitest";
import { asyncFromArray, collect } from "../src/async";

describe("async helpers", () => {
  it("collects values from an async iterable", async () => {
    const source = asyncFromArray([1, 2, 3]);
    const out = await collect(source);
    expect(out).toEqual([1, 2, 3]);
  });

  it("works with empty iterables", async () => {
    const out = await collect(asyncFromArray([]));
    expect(out).toEqual([]);
  });

  it("calls cleanup when source throws (cleanup on error)", async () => {
    let cleaned = false;

    async function* source() {
      try {
        yield 1;
        throw new Error("boom");
      } finally {
        cleaned = true;
      }
    }

    await expect(collect(source())).rejects.toThrow("boom");
    expect(cleaned).toBe(true);
  });

  it("propagates source errors (still throws)", async () => {
    async function* source() {
      yield 1;
      throw new Error("boom");
    }

    await expect(collect(source())).rejects.toThrow("boom");
  });

  it("asyncFromArray supports delay option (yields values)", async () => {
    const out: number[] = [];
    for await (const v of asyncFromArray([4, 5, 6], { delay: 1 })) {
      out.push(v);
    }
    expect(out).toEqual([4, 5, 6]);
  });
});
