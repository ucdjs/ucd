import type { ParsedRow } from "../../src/types";
import { createSortTransform, sortByCodePoint } from "#builtin-transforms/sort";
import { asyncFromArray, collect } from "#test-utils";
import { describe, expect, it } from "vitest";

describe("sortByCodePoint", () => {
  it("sorts point rows by codePoint hex value ascending", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0043" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0042" },
    ];
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray(rows)));
    expect(result.map((r) => r.codePoint)).toEqual(["0041", "0042", "0043"]);
  });

  it("sorts range rows by start hex value ascending", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0050", end: "0060" },
      { sourceFile: "b.txt", kind: "range", start: "0020", end: "0030" },
    ];
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.start).toBe("0020");
    expect(result[1]?.start).toBe("0050");
  });

  it("sorts sequence rows by first element ascending", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "sequence", sequence: ["0043", "0044"] },
      { sourceFile: "b.txt", kind: "sequence", sequence: ["0041", "0042"] },
    ];
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.sequence?.[0]).toBe("0041");
    expect(result[1]?.sequence?.[0]).toBe("0043");
  });

  it("mixed kinds interleave correctly (numeric ordering)", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0050", end: "0060" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0030" },
      { sourceFile: "c.txt", kind: "sequence", sequence: ["0040"] },
    ];
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray(rows)));
    // 0x30=48, 0x40=64, 0x50=80
    expect(result[0]?.kind).toBe("point");
    expect(result[1]?.kind).toBe("sequence");
    expect(result[2]?.kind).toBe("range");
  });

  it("already-sorted input is unchanged", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0042" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0043" },
    ];
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray(rows)));
    expect(result.map((r) => r.codePoint)).toEqual(["0041", "0042", "0043"]);
  });

  it("empty input → empty output", async () => {
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray<ParsedRow>([])));
    expect(result).toEqual([]);
  });

  it("single-element input passes through unchanged", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041" },
    ];
    const result = await collect(sortByCodePoint.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.codePoint).toBe("0041");
  });
});

describe("createSortTransform({ direction: 'asc' })", () => {
  it("sorts ascending (same as sortByCodePoint)", async () => {
    const transform = createSortTransform({ direction: "asc" });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0043" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0042" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result.map((r) => r.codePoint)).toEqual(["0041", "0042", "0043"]);
  });
});

describe("createSortTransform({ direction: 'desc' })", () => {
  it("sorts descending order", async () => {
    const transform = createSortTransform({ direction: "desc" });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0043" },
      { sourceFile: "c.txt", kind: "point", codePoint: "0042" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result.map((r) => r.codePoint)).toEqual(["0043", "0042", "0041"]);
  });
});

describe("createSortTransform({ keyFn })", () => {
  it("custom numeric key drives ordering (sort by end of a range)", async () => {
    const transform = createSortTransform({
      keyFn: (row) => row.end ? Number.parseInt(row.end, 16) : 0,
    });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0010", end: "0050" },
      { sourceFile: "b.txt", kind: "range", start: "0010", end: "0030" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.end).toBe("0030");
    expect(result[1]?.end).toBe("0050");
  });

  it("rows missing sort key fields default to 0", async () => {
    const transform = createSortTransform({ direction: "asc" });
    // alias rows have no codePoint/start/sequence → sort key = 0
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "alias", value: "Z" },
      { sourceFile: "b.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "c.txt", kind: "alias", value: "A" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    // aliases default to key 0, points to 0x41=65; aliases come first
    expect(result.at(-1)?.kind).toBe("point");
  });
});
