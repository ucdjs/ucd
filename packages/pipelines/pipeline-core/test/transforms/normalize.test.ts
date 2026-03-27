import type { ParsedRow } from "../../src/types";
import { createNormalizeTransform, normalizeCodePoints } from "#builtin-transforms/normalize";
import { asyncFromArray, collect } from "#test-utils";
import { describe, expect, it } from "vitest";

describe("normalizeCodePoints", () => {
  it("strips leading zeros and re-pads to 4: '0041' → '0041'", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0041" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("0041");
  });

  it("pads short hex to 4: '041' → '0041'", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "041" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("0041");
  });

  it("removes excess leading zeros: '0000041' → '0041'", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0000041" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("0041");
  });

  it("lowercased input is uppercased: '004a' → '004A'", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "004a" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("004A");
  });

  it("normalizes start and end on range rows", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "041", end: "05a" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.start).toBe("0041");
    expect(result[0]?.end).toBe("005A");
  });

  it("normalizes each element of sequence on sequence rows", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "sequence", sequence: ["41", "005a"] },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.sequence).toEqual(["0041", "005A"]);
  });

  it("rows with none of the fields pass through unchanged (e.g. alias)", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "alias", value: "X" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]).toEqual(rows[0]);
  });

  it("bare '0' normalizes to '0000'", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "0" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("0000");
  });

  it("all-zero input normalizes to '0000'", async () => {
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "000000" },
    ];
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("0000");
  });

  it("empty input → empty output", async () => {
    const result = await collect(normalizeCodePoints.fn(null as any, asyncFromArray<ParsedRow>([])));
    expect(result).toEqual([]);
  });
});

describe("createNormalizeTransform(padLength)", () => {
  it("padLength = 6 pads to 6 digits: '4a' → '00004A'", async () => {
    const transform = createNormalizeTransform(6);
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "4a" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("00004A");
  });

  it("padLength = 2: '4a' → '4A'", async () => {
    const transform = createNormalizeTransform(2);
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "4a" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("4A");
  });

  it("padLength = 2: '9' → '09'", async () => {
    const transform = createNormalizeTransform(2);
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "point", codePoint: "9" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.codePoint).toBe("09");
  });

  it("normalizes start, end, sequence at the custom length", async () => {
    const transform = createNormalizeTransform(6);
    const rows: ParsedRow[] = [
      { sourceFile: "a.txt", kind: "range", start: "41", end: "5a" },
    ];
    const result = await collect(transform.fn(null as any, asyncFromArray(rows)));
    expect(result[0]?.start).toBe("000041");
    expect(result[0]?.end).toBe("00005A");
  });
});
