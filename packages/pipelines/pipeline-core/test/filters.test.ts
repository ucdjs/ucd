import type { PipelineLogger } from "../src/logger";
import type { FileContext, FilterContext } from "../src/types";
import { describe, expect, it } from "vitest";
import {
  always,
  and,
  byDir,
  byExt,
  byGlob,
  byName,
  byPath,
  byProp,
  bySource,
  getFilterDescription,
  never,
  not,
  or,
} from "../src/filters";

const noopLogger: PipelineLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function createFileContext(overrides: Partial<FileContext> = {}): FileContext {
  return {
    version: "16.0.0",
    dir: "ucd",
    path: "ucd/LineBreak.txt",
    name: "LineBreak.txt",
    ext: ".txt",
    ...overrides,
  };
}

function createFilterContext(
  fileOverrides: Partial<FileContext> = {},
  rowProperty?: string,
  sourceId?: string,
): FilterContext {
  return {
    file: createFileContext(fileOverrides),
    logger: noopLogger,
    row: rowProperty ? { property: rowProperty } : undefined,
    source: sourceId ? { id: sourceId } : undefined,
  };
}

describe("byName", () => {
  it.each([
    ["LineBreak.txt", "LineBreak.txt", true],
    ["LineBreak.txt", "PropList.txt", false],
    ["LineBreak.txt", "linebreak.txt", false],
  ])("byName(%j) vs %j → %s", (filter, name, expected) => {
    expect(byName(filter)(createFilterContext({ name }))).toBe(expected);
  });
});

describe("byDir", () => {
  it.each([
    ["ucd", "ucd", true],
    ["emoji", "emoji", true],
    ["custom-dir", "custom-dir", true],
    ["ucd", "emoji", false],
  ])("byDir(%j) vs %j → %s", (filter, dir, expected) => {
    expect(byDir(filter)(createFilterContext({ dir }))).toBe(expected);
  });
});

describe("byExt", () => {
  it.each([
    [".txt", ".txt", true],
    ["txt", ".txt", true],
    [".txt", ".xml", false],
    ["", "", true],
    ["", ".txt", false],
  ])("byExt(%j) vs %j → %s", (filter, ext, expected) => {
    expect(byExt(filter)(createFilterContext({ ext }))).toBe(expected);
  });
});

describe("byGlob", () => {
  it.each([
    ["ucd/*.txt", "ucd/LineBreak.txt", true],
    ["**/*.txt", "ucd/extracted/LineBreak.txt", true],
    ["ucd/*.txt", "emoji/data.txt", false],
    ["ucd/*.{txt,xml}", "ucd/file.txt", true],
    ["ucd/*.{txt,xml}", "ucd/file.xml", true],
    ["ucd/*.{txt,xml}", "ucd/file.json", false],
  ])("byGlob(%j) vs %j → %s", (pattern, path, expected) => {
    expect(byGlob(pattern)(createFilterContext({ path }))).toBe(expected);
  });
});

describe("byPath", () => {
  it.each<[string | RegExp, string, boolean]>([
    ["ucd/LineBreak.txt", "ucd/LineBreak.txt", true],
    ["ucd/LineBreak.txt", "ucd/PropList.txt", false],
    [/LineBreak/, "ucd/LineBreak.txt", true],
    [/^ucd\/.*\.txt$/, "emoji/file.txt", false],
  ])("byPath(%s) vs %j → %s", (pattern, path, expected) => {
    expect(byPath(pattern)(createFilterContext({ path }))).toBe(expected);
  });
});

describe("byProp", () => {
  it.each<[string | RegExp, string | undefined, boolean]>([
    ["NFKC_Casefold", "NFKC_Casefold", true],
    ["NFKC_Casefold", "Line_Break", false],
    ["NFKC_Casefold", undefined, false],
    [/^NFKC_/, "NFKC_Casefold", true],
    [/^NFKC_/, "Line_Break", false],
    [/^NFKC_/, undefined, false],
  ])("byProp(%s) vs %s → %s", (pattern, prop, expected) => {
    expect(byProp(pattern)(createFilterContext({}, prop))).toBe(expected);
  });
});

describe("bySource", () => {
  it.each<[string | string[], string | undefined, boolean]>([
    ["unicode", "unicode", true],
    ["unicode", "cldr", false],
    ["unicode", undefined, false],
    [["unicode", "cldr"], "unicode", true],
    [["unicode", "cldr"], "cldr", true],
    [["unicode", "cldr"], "other", false],
  ])("bySource(%j) vs %s → %s", (ids, sourceId, expected) => {
    expect(bySource(ids)(createFilterContext({}, undefined, sourceId))).toBe(expected);
  });
});

describe("and", () => {
  it("should require all filters to pass", () => {
    const filter = and(byDir("ucd"), byExt(".txt"), byName("LineBreak.txt"));

    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt", name: "LineBreak.txt" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt", name: "PropList.txt" }))).toBe(false);
  });

  it("should return true for empty filter array", () => {
    expect(and()(createFilterContext())).toBe(true);
  });
});

describe("or", () => {
  it("should pass when any filter matches", () => {
    const filter = or(byName("LineBreak.txt"), byName("PropList.txt"));

    expect(filter(createFilterContext({ name: "LineBreak.txt" }))).toBe(true);
    expect(filter(createFilterContext({ name: "UnicodeData.txt" }))).toBe(false);
  });

  it("should return false for empty filter array", () => {
    expect(or()(createFilterContext())).toBe(false);
  });
});

describe("not", () => {
  it("should invert filter result", () => {
    const filter = not(byDir("ucd"));

    expect(filter(createFilterContext({ dir: "ucd" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "emoji" }))).toBe(true);
  });
});

describe("always / never", () => {
  it("always returns true", () => {
    expect(always()(createFilterContext())).toBe(true);
  });

  it("never returns false", () => {
    expect(never()(createFilterContext())).toBe(false);
  });
});

describe("complex filter combinations", () => {
  it("should combine and/or/not filters", () => {
    const filter = and(byDir("ucd"), or(byExt(".txt"), byExt(".xml")), not(byName("ReadMe.txt")));

    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt", name: "LineBreak.txt" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".xml", name: "data.xml" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt", name: "ReadMe.txt" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "emoji", ext: ".txt", name: "data.txt" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".json", name: "data.json" }))).toBe(false);
  });
});

describe("getFilterDescription", () => {
  it.each([
    [byName("foo"), "byName(\"foo\")"],
    [byDir("emoji"), "byDir(\"emoji\")"],
    [byExt(".txt"), "byExt(\".txt\")"],
    [byExt("txt"), "byExt(\".txt\")"],
    [byExt(""), "byExt(\"\")"],
    [byGlob("**/*.txt"), "byGlob(\"**/*.txt\")"],
    [byPath("ucd/LineBreak.txt"), "byPath(\"ucd/LineBreak.txt\")"],
    [byPath(/^ucd\/.*\.txt$/), "byPath(/^ucd\\/.*\\.txt$/)"],
    [byProp("Line_Break"), "byProp(\"Line_Break\")"],
    [byProp(/^NFKC_/), "byProp(/^NFKC_/)"],
    [bySource("unicode"), "bySource(\"unicode\")"],
    [bySource(["unicode", "cldr"]), "bySource([\"unicode\",\"cldr\"])"],
    [always(), "always()"],
    [never(), "never()"],
  ] as const)("leaf: %s → %s", (filter, expected) => {
    expect(getFilterDescription(filter)).toBe(expected);
  });

  it.each([
    [and(byName("a"), byExt(".txt")), "byName(\"a\") AND byExt(\".txt\")"],
    [or(byName("a"), byName("b")), "byName(\"a\") OR byName(\"b\")"],
    [not(byName("a")), "NOT byName(\"a\")"],
  ] as const)("combinator: %s → %s", (filter, expected) => {
    expect(getFilterDescription(filter)).toBe(expected);
  });

  it.each([
    [
      and(or(byName("a"), byName("b")), byExt(".txt")),
      "(byName(\"a\") OR byName(\"b\")) AND byExt(\".txt\")",
    ],
    [
      or(and(byDir("emoji"), byExt(".txt")), byName("e.txt")),
      "(byDir(\"emoji\") AND byExt(\".txt\")) OR byName(\"e.txt\")",
    ],
    [
      not(or(byName("a"), byName("b"))),
      "NOT (byName(\"a\") OR byName(\"b\"))",
    ],
    [
      not(and(byDir("ucd"), byExt(".txt"))),
      "NOT (byDir(\"ucd\") AND byExt(\".txt\"))",
    ],
    [
      and(
        or(byDir("ucd"), byDir("emoji")),
        not(or(byName("ReadMe.txt"), byName("Index.txt"))),
        byExt(".txt"),
      ),
      "(byDir(\"ucd\") OR byDir(\"emoji\")) AND NOT (byName(\"ReadMe.txt\") OR byName(\"Index.txt\")) AND byExt(\".txt\")",
    ],
  ] as const)("nested: %s → %s", (filter, expected) => {
    expect(getFilterDescription(filter)).toBe(expected);
  });

  it("should return undefined for plain functions", () => {
    expect(getFilterDescription((_) => true)).toBeUndefined();
  });

  it("should describe plain function as <custom> inside combinator", () => {
    expect(getFilterDescription(and(byName("a"), (_) => true))).toBe("byName(\"a\") AND <custom>");
  });
});
