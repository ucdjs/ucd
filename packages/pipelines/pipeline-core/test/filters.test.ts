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
import { createMockFilterContext } from "./_test-utils";

describe("byName", () => {
  it.each([
    ["LineBreak.txt", "LineBreak.txt", true],
    ["LineBreak.txt", "PropList.txt", false],
    ["LineBreak.txt", "linebreak.txt", false],
  ])("byName(%j) vs %j → %s", (filter, name, expected) => {
    expect(byName(filter)(createMockFilterContext({
      file: {
        name,
      },
    }))).toBe(expected);
  });
});

describe("byDir", () => {
  it.each([
    ["ucd", "ucd", true],
    ["emoji", "emoji", true],
    ["custom-dir", "custom-dir", true],
    ["ucd", "emoji", false],
  ])("byDir(%j) vs %j → %s", (filter, dir, expected) => {
    expect(byDir(filter)(createMockFilterContext({
      file: {
        dir,
      },
    }))).toBe(expected);
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
    expect(byExt(filter)(createMockFilterContext({
      file: {
        ext,
      },
    }))).toBe(expected);
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
    expect(byGlob(pattern)(createMockFilterContext({
      file: {
        path,
      },
    }))).toBe(expected);
  });
});

describe("byPath", () => {
  it.each<[string | RegExp, string, boolean]>([
    ["ucd/LineBreak.txt", "ucd/LineBreak.txt", true],
    ["ucd/LineBreak.txt", "ucd/PropList.txt", false],
    [/LineBreak/, "ucd/LineBreak.txt", true],
    [/^ucd\/.*\.txt$/, "emoji/file.txt", false],
  ])("byPath(%s) vs %j → %s", (pattern, path, expected) => {
    expect(byPath(pattern)(createMockFilterContext({
      file: {
        path,
      },
    }))).toBe(expected);
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
    expect(byProp(pattern)(createMockFilterContext({
      row: {
        property: prop,
      },
    }))).toBe(expected);
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
    expect(bySource(ids)(createMockFilterContext({
      source: {
        id: sourceId,
      },
    }))).toBe(expected);
  });
});

describe("and", () => {
  it("should require all filters to pass", () => {
    const filter = and(byDir("ucd"), byExt(".txt"), byName("LineBreak.txt"));

    expect(filter(createMockFilterContext({ file: { dir: "ucd", ext: ".txt", name: "LineBreak.txt" } }))).toBe(true);
    expect(filter(createMockFilterContext({ file: { dir: "ucd", ext: ".txt", name: "PropList.txt" } }))).toBe(false);
  });

  it("should return true for empty filter array", () => {
    expect(and()(createMockFilterContext())).toBe(true);
  });
});

describe("or", () => {
  it("should pass when any filter matches", () => {
    const filter = or(byName("LineBreak.txt"), byName("PropList.txt"));

    expect(filter(createMockFilterContext({ file: { name: "LineBreak.txt" } }))).toBe(true);
    expect(filter(createMockFilterContext({ file: { name: "UnicodeData.txt" } }))).toBe(false);
  });

  it("should return false for empty filter array", () => {
    expect(or()(createMockFilterContext())).toBe(false);
  });
});

describe("not", () => {
  it("should invert filter result", () => {
    const filter = not(byDir("ucd"));

    expect(filter(createMockFilterContext({ file: { dir: "ucd" } }))).toBe(false);
    expect(filter(createMockFilterContext({ file: { dir: "emoji" } }))).toBe(true);
  });
});

describe("always / never", () => {
  it("always returns true", () => {
    expect(always()(createMockFilterContext())).toBe(true);
  });

  it("never returns false", () => {
    expect(never()(createMockFilterContext())).toBe(false);
  });
});

describe("complex filter combinations", () => {
  it("should combine and/or/not filters", () => {
    const filter = and(byDir("ucd"), or(byExt(".txt"), byExt(".xml")), not(byName("ReadMe.txt")));

    expect(filter(createMockFilterContext({ file: { dir: "ucd", ext: ".txt", name: "LineBreak.txt" } }))).toBe(true);
    expect(filter(createMockFilterContext({ file: { dir: "ucd", ext: ".xml", name: "data.xml" } }))).toBe(true);
    expect(filter(createMockFilterContext({ file: { dir: "ucd", ext: ".txt", name: "ReadMe.txt" } }))).toBe(false);
    expect(filter(createMockFilterContext({ file: { dir: "emoji", ext: ".txt", name: "data.txt" } }))).toBe(false);
    expect(filter(createMockFilterContext({ file: { dir: "ucd", ext: ".json", name: "data.json" } }))).toBe(false);
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
  ])("leaf: %s → %s", (filter, expected) => {
    expect(getFilterDescription(filter)).toBe(expected);
  });

  it.each([
    [and(byName("a"), byExt(".txt")), "byName(\"a\") AND byExt(\".txt\")"],
    [or(byName("a"), byName("b")), "byName(\"a\") OR byName(\"b\")"],
    [not(byName("a")), "NOT byName(\"a\")"],
  ])("combinator: %s → %s", (filter, expected) => {
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
  ])("nested: %s → %s", (filter, expected) => {
    expect(getFilterDescription(filter)).toBe(expected);
  });

  it("should return undefined for plain functions", () => {
    expect(getFilterDescription((_) => true)).toBeUndefined();
  });

  it("should describe plain function as <custom> inside combinator", () => {
    expect(getFilterDescription(and(byName("a"), (_) => true))).toBe("byName(\"a\") AND <custom>");
  });
});
