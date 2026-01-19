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
  never,
  not,
  or,
} from "../src/filters";

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
    row: rowProperty ? { property: rowProperty } : undefined,
    source: sourceId ? { id: sourceId } : undefined,
  };
}

describe("byName", () => {
  it("should match exact file name", () => {
    const filter = byName("LineBreak.txt");
    const ctx = createFilterContext({ name: "LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should not match different file name", () => {
    const filter = byName("LineBreak.txt");
    const ctx = createFilterContext({ name: "PropList.txt" });

    expect(filter(ctx)).toBe(false);
  });

  it("should be case-sensitive", () => {
    const filter = byName("LineBreak.txt");
    const ctx = createFilterContext({ name: "linebreak.txt" });

    expect(filter(ctx)).toBe(false);
  });
});

describe("byDir", () => {
  it("should match ucd directory", () => {
    const filter = byDir("ucd");
    const ctx = createFilterContext({ dir: "ucd" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match extracted directory", () => {
    const filter = byDir("extracted");
    const ctx = createFilterContext({ dir: "extracted" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match auxiliary directory", () => {
    const filter = byDir("auxiliary");
    const ctx = createFilterContext({ dir: "auxiliary" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match emoji directory", () => {
    const filter = byDir("emoji");
    const ctx = createFilterContext({ dir: "emoji" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match unihan directory", () => {
    const filter = byDir("unihan");
    const ctx = createFilterContext({ dir: "unihan" });

    expect(filter(ctx)).toBe(true);
  });

  it("should not match different directory", () => {
    const filter = byDir("ucd");
    const ctx = createFilterContext({ dir: "emoji" });

    expect(filter(ctx)).toBe(false);
  });

  it("should match custom directory", () => {
    const filter = byDir("custom-dir");
    const ctx = createFilterContext({ dir: "custom-dir" });

    expect(filter(ctx)).toBe(true);
  });
});

describe("byExt", () => {
  it("should match extension with dot", () => {
    const filter = byExt(".txt");
    const ctx = createFilterContext({ ext: ".txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match extension without dot", () => {
    const filter = byExt("txt");
    const ctx = createFilterContext({ ext: ".txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should not match different extension", () => {
    const filter = byExt(".txt");
    const ctx = createFilterContext({ ext: ".xml" });

    expect(filter(ctx)).toBe(false);
  });

  it("should match empty extension", () => {
    const filter = byExt("");
    const ctx = createFilterContext({ ext: "" });

    expect(filter(ctx)).toBe(true);
  });

  it("should not match non-empty extension when filter is empty", () => {
    const filter = byExt("");
    const ctx = createFilterContext({ ext: ".txt" });

    expect(filter(ctx)).toBe(false);
  });
});

describe("byGlob", () => {
  it("should match wildcard pattern", () => {
    const filter = byGlob("ucd/*.txt");
    const ctx = createFilterContext({ path: "ucd/LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match double-star pattern", () => {
    const filter = byGlob("**/*.txt");
    const ctx = createFilterContext({ path: "ucd/extracted/LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match specific file pattern", () => {
    const filter = byGlob("ucd/LineBreak.txt");
    const ctx = createFilterContext({ path: "ucd/LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should not match excluded pattern", () => {
    const filter = byGlob("ucd/*.txt");
    const ctx = createFilterContext({ path: "emoji/data.txt" });

    expect(filter(ctx)).toBe(false);
  });

  it("should match multiple extensions with brace expansion", () => {
    const filter = byGlob("ucd/*.{txt,xml}");

    expect(filter(createFilterContext({ path: "ucd/file.txt" }))).toBe(true);
    expect(filter(createFilterContext({ path: "ucd/file.xml" }))).toBe(true);
    expect(filter(createFilterContext({ path: "ucd/file.json" }))).toBe(false);
  });
});

describe("byPath", () => {
  it("should match exact path string", () => {
    const filter = byPath("ucd/LineBreak.txt");
    const ctx = createFilterContext({ path: "ucd/LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should not match different path", () => {
    const filter = byPath("ucd/LineBreak.txt");
    const ctx = createFilterContext({ path: "ucd/PropList.txt" });

    expect(filter(ctx)).toBe(false);
  });

  it("should match regex pattern", () => {
    const filter = byPath(/LineBreak/);
    const ctx = createFilterContext({ path: "ucd/LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should match complex regex", () => {
    const filter = byPath(/^ucd\/.*\.txt$/);

    expect(filter(createFilterContext({ path: "ucd/LineBreak.txt" }))).toBe(true);
    expect(filter(createFilterContext({ path: "ucd/file.txt" }))).toBe(true);
    expect(filter(createFilterContext({ path: "emoji/file.txt" }))).toBe(false);
    expect(filter(createFilterContext({ path: "ucd/file.xml" }))).toBe(false);
  });
});

describe("byProp", () => {
  it("should match exact property name", () => {
    const filter = byProp("NFKC_Casefold");
    const ctx = createFilterContext({}, "NFKC_Casefold");

    expect(filter(ctx)).toBe(true);
  });

  it("should not match different property", () => {
    const filter = byProp("NFKC_Casefold");
    const ctx = createFilterContext({}, "Line_Break");

    expect(filter(ctx)).toBe(false);
  });

  it("should return false when no row context", () => {
    const filter = byProp("NFKC_Casefold");
    const ctx = createFilterContext();

    expect(filter(ctx)).toBe(false);
  });

  it("should match regex pattern", () => {
    const filter = byProp(/^NFKC_/);
    const ctx = createFilterContext({}, "NFKC_Casefold");

    expect(filter(ctx)).toBe(true);
  });

  it("should not match when regex does not match", () => {
    const filter = byProp(/^NFKC_/);
    const ctx = createFilterContext({}, "Line_Break");

    expect(filter(ctx)).toBe(false);
  });

  it("should return false for regex when no property", () => {
    const filter = byProp(/^NFKC_/);
    const ctx = createFilterContext();

    expect(filter(ctx)).toBe(false);
  });
});

describe("bySource", () => {
  it("should match single source id", () => {
    const filter = bySource("unicode");
    const ctx = createFilterContext({}, undefined, "unicode");

    expect(filter(ctx)).toBe(true);
  });

  it("should match array of source ids", () => {
    const filter = bySource(["unicode", "cldr"]);

    expect(filter(createFilterContext({}, undefined, "unicode"))).toBe(true);
    expect(filter(createFilterContext({}, undefined, "cldr"))).toBe(true);
    expect(filter(createFilterContext({}, undefined, "other"))).toBe(false);
  });

  it("should not match when source is undefined", () => {
    const filter = bySource("unicode");
    const ctx = createFilterContext();

    expect(filter(ctx)).toBe(false);
  });

  it("should not match different source", () => {
    const filter = bySource("unicode");
    const ctx = createFilterContext({}, undefined, "cldr");

    expect(filter(ctx)).toBe(false);
  });
});

describe("and", () => {
  it("should return true when all filters pass", () => {
    const filter = and(
      byDir("ucd"),
      byExt(".txt"),
      byName("LineBreak.txt"),
    );
    const ctx = createFilterContext({
      dir: "ucd",
      ext: ".txt",
      name: "LineBreak.txt",
    });

    expect(filter(ctx)).toBe(true);
  });

  it("should return false when any filter fails", () => {
    const filter = and(
      byDir("ucd"),
      byExt(".txt"),
      byName("PropList.txt"),
    );
    const ctx = createFilterContext({
      dir: "ucd",
      ext: ".txt",
      name: "LineBreak.txt",
    });

    expect(filter(ctx)).toBe(false);
  });

  it("should return true for empty filter array", () => {
    const filter = and();
    const ctx = createFilterContext();

    expect(filter(ctx)).toBe(true);
  });

  it("should work with single filter", () => {
    const filter = and(byDir("ucd"));
    const ctx = createFilterContext({ dir: "ucd" });

    expect(filter(ctx)).toBe(true);
  });
});

describe("or", () => {
  it("should return true when any filter passes", () => {
    const filter = or(
      byName("LineBreak.txt"),
      byName("PropList.txt"),
    );
    const ctx = createFilterContext({ name: "LineBreak.txt" });

    expect(filter(ctx)).toBe(true);
  });

  it("should return false when all filters fail", () => {
    const filter = or(
      byName("LineBreak.txt"),
      byName("PropList.txt"),
    );
    const ctx = createFilterContext({ name: "UnicodeData.txt" });

    expect(filter(ctx)).toBe(false);
  });

  it("should return false for empty filter array", () => {
    const filter = or();
    const ctx = createFilterContext();

    expect(filter(ctx)).toBe(false);
  });

  it("should work with single filter", () => {
    const filter = or(byDir("ucd"));

    expect(filter(createFilterContext({ dir: "ucd" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "emoji" }))).toBe(false);
  });
});

describe("not", () => {
  it("should invert filter result", () => {
    const filter = not(byDir("ucd"));

    expect(filter(createFilterContext({ dir: "ucd" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "emoji" }))).toBe(true);
  });

  it("should work with complex filters", () => {
    const filter = not(and(byDir("ucd"), byExt(".txt")));

    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".xml" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "emoji", ext: ".txt" }))).toBe(true);
  });
});

describe("always", () => {
  it("should always return true", () => {
    const filter = always();

    expect(filter(createFilterContext())).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "emoji" }))).toBe(true);
  });
});

describe("never", () => {
  it("should always return false", () => {
    const filter = never();

    expect(filter(createFilterContext())).toBe(false);
    expect(filter(createFilterContext({ dir: "ucd" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "emoji" }))).toBe(false);
  });
});

describe("complex filter combinations", () => {
  it("should combine and/or/not filters", () => {
    const filter = and(
      byDir("ucd"),
      or(
        byExt(".txt"),
        byExt(".xml"),
      ),
      not(byName("ReadMe.txt")),
    );

    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt", name: "LineBreak.txt" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".xml", name: "data.xml" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt", name: "ReadMe.txt" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "emoji", ext: ".txt", name: "data.txt" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".json", name: "data.json" }))).toBe(false);
  });

  it("should handle nested logic", () => {
    const filter = or(
      and(byDir("ucd"), byExt(".txt")),
      and(byDir("emoji"), byExt(".txt")),
    );

    expect(filter(createFilterContext({ dir: "ucd", ext: ".txt" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "emoji", ext: ".txt" }))).toBe(true);
    expect(filter(createFilterContext({ dir: "ucd", ext: ".xml" }))).toBe(false);
    expect(filter(createFilterContext({ dir: "auxiliary", ext: ".txt" }))).toBe(false);
  });
});
