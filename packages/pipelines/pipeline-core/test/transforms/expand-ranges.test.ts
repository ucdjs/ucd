import type { ParsedRow } from "../../src/types";
import { createExpandRangesTransform, expandRanges } from "#builtin-transforms/expand-ranges";
import { asyncFromArray, collect } from "#test-utils";
import { describe, expect, it } from "vitest";

describe("expandRanges", () => {
  it("expands a range into individual point rows", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0043", value: "Latin" },
    ];
    const result = await collect(expandRanges.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.codePoint)).toEqual(["0041", "0042", "0043"]);
  });

  it("expanded rows have kind: 'point' and start/end set to undefined", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0042" },
    ];
    const result = await collect(expandRanges.fn(null as any, asyncFromArray(rows)));
    for (const row of result) {
      expect(row.kind).toBe("point");
      expect(row.start).toBeUndefined();
      expect(row.end).toBeUndefined();
    }
  });

  it("codePoint in output is uppercase and zero-padded to 4 chars", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0001", end: "0002" },
    ];
    const result = await collect(expandRanges.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("0001");
    expect(result[1]?.codePoint).toBe("0002");
  });

  it("passes through non-range rows unchanged", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041" },
      { sourceFile: "b.txt", kind: "sequence", sequence: ["0041", "0042"] },
    ];
    const result = await collect(expandRanges.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(2);
    expect(result[0]?.kind).toBe("point");
    expect(result[1]?.kind).toBe("sequence");
  });

  it("single-point range expands to one point row", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0041" },
    ];
    const result = await collect(expandRanges.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.codePoint).toBe("0041");
  });

  it("range spanning 0000..000F expands to 16 points in correct order", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0000", end: "000F" },
    ];
    const result = await collect(expandRanges.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(16);
    expect(result[0]?.codePoint).toBe("0000");
    expect(result[15]?.codePoint).toBe("000F");
  });

  it("empty input → empty output", async () => {
    const result = await collect(expandRanges.fn(null as any, asyncFromArray<ParsedRow>([])));
    expect(result).toEqual([]);
  });
});

describe("createExpandRangesTransform({ maxExpansion })", () => {
  it("range whose size ≤ maxExpansion gets expanded", async () => {
    const transform = createExpandRangesTransform({ maxExpansion: 5 });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0043" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(3);
    expect(result[0]?.kind).toBe("point");
  });

  it("range whose size > maxExpansion passes through unchanged", async () => {
    const transform = createExpandRangesTransform({ maxExpansion: 2 });
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0043" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("range");
    expect(result[0]?.start).toBe("0041");
  });

  it("default maxExpansion is 10000 — a small range expands", async () => {
    const transform = createExpandRangesTransform();
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0041", end: "0043" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(3);
    expect(result[0]?.kind).toBe("point");
  });

  it("range of 10001 entries does not expand with default maxExpansion", async () => {
    const transform = createExpandRangesTransform();
    // 0000..2710 = 10001 entries
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "0000", end: "2710" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("range");
  });

  it("empty input → empty output", async () => {
    const transform = createExpandRangesTransform({ maxExpansion: 100 });
    const result = await collect(transform.fn(null as any, asyncFromArray<ParsedRow>([])));
    expect(result).toEqual([]);
  });
});
