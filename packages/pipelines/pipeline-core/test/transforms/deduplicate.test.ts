import type { ParsedRow } from "../../src/types";
import { createDeduplicateTransform, deduplicateRows } from "#builtin-transforms/deduplicate";
import { asyncFromArray, collect } from "#test-utils";
import { describe, expect, it } from "vitest";

describe("deduplicateRows", () => {
  it("keeps first of duplicate points", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041", value: "A" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0041", value: "B" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0042", value: "C" },
    ];

    const result = await collect(deduplicateRows.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(2);
    expect(result[0]?.value).toBe("A");
    expect(result[1]?.value).toBe("C");
  });

  it("keeps first of duplicate ranges", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0050", value: "first" },
      { sourceFile: "b.txt", kind: "range", start: "0041", end: "0050", value: "second" },
    ];
    const result = await collect(deduplicateRows.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("first");
  });

  it("keeps first of duplicate sequences", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "sequence", sequence: ["0041", "0042"], value: "first" },
      { sourceFile: "b.txt", kind: "sequence", sequence: ["0041", "0042"], value: "second" },
    ];
    const result = await collect(deduplicateRows.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("first");
  });

  it("passes through rows with no duplicates", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0042" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0043" },
    ];
    const result = await collect(deduplicateRows.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(3);
  });

  it("empty input → empty output", async () => {
    const result = await collect(deduplicateRows.fn(null as any, asyncFromArray<ParsedRow>([])));
    expect(result).toEqual([]);
  });
});

describe("createDeduplicateTransform({ strategy: 'first' })", () => {
  it("keeps first occurrence of duplicate points", async () => {
    const transform = createDeduplicateTransform({ strategy: "first" });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041", value: "first" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0041", value: "second" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("first");
  });
});

describe("createDeduplicateTransform({ strategy: 'last' })", () => {
  it("keeps last occurrence; earlier duplicate is dropped", async () => {
    const transform = createDeduplicateTransform({ strategy: "last" });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041", value: "first" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0042", value: "second" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0041", value: "third" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(2);
    const byCodePoint = Object.fromEntries(result.map((r) => [r.codePoint, r.value]));
    expect(byCodePoint["0041"]).toBe("third");
    expect(byCodePoint["0042"]).toBe("second");
  });

  it("preserves iteration order of survivors (map insertion order)", async () => {
    const transform = createDeduplicateTransform({ strategy: "last" });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041", value: "v1" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0042", value: "v2" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0041", value: "v3" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    // map insertion order: 0041 was inserted first, 0042 second; last values overwrite
    expect(result[0]?.codePoint).toBe("0041");
    expect(result[0]?.value).toBe("v3");
    expect(result[1]?.codePoint).toBe("0042");
  });
});

describe("createDeduplicateTransform({ keyFn })", () => {
  it("custom key function drives deduplication", async () => {
    const transform = createDeduplicateTransform({
      keyFn: (row) => row.value as string,
    });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041", value: "same" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0042", value: "same" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0043", value: "different" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(2);
    expect(result[0]?.codePoint).toBe("0041");
    expect(result[1]?.codePoint).toBe("0043");
  });

  it("alias rows fall back to JSON-stringified key (all pass through as unique)", async () => {
    const transform = createDeduplicateTransform({ strategy: "first" });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "alias", value: "X" },
      { sourceFile: "b.txt", kind: "alias", value: "Y" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(2);
  });
});
