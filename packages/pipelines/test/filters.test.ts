import type { FileContext } from "../src/types";
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
  never,
  not,
  or,
} from "../src/filters";

function createFile(path: string, version = "16.0.0"): FileContext {
  return {
    path,
    name: path.split("/").pop() ?? path,
    dir: path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "",
    ext: path.includes(".") ? path.substring(path.lastIndexOf(".")) : "",
    version,
  };
}

describe("byName", () => {
  it("should match exact file name", () => {
    const filter = byName("LineBreak.txt");

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(true);
  });

  it("should not match different file names", () => {
    const filter = byName("LineBreak.txt");

    expect(filter({ file: createFile("WordBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("linebreak.txt") })).toBe(false);
    expect(filter({ file: createFile("LineBreak.html") })).toBe(false);
  });

  it("should match file name regardless of directory", () => {
    const filter = byName("UnicodeData.txt");

    expect(filter({ file: createFile("UnicodeData.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/UnicodeData.txt") })).toBe(true);
    expect(filter({ file: createFile("deep/nested/path/UnicodeData.txt") })).toBe(true);
  });
});

describe("byDir", () => {
  it("should match files in specific directory", () => {
    const filter = byDir("ucd");

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/UnicodeData.txt") })).toBe(true);
  });

  it("should not match files in different directories", () => {
    const filter = byDir("ucd");

    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("extracted/DerivedName.txt") })).toBe(false);
    expect(filter({ file: createFile("LineBreak.txt") })).toBe(false);
  });

  it("should match root directory with empty string", () => {
    const filter = byDir("");

    expect(filter({ file: createFile("ReadMe.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(false);
  });

  it("should match nested directories", () => {
    const filter = byDir("ucd/auxiliary");

    expect(filter({ file: createFile("ucd/auxiliary/WordBreakTest.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(false);
  });
});

describe("byExt", () => {
  it("should match files by extension", () => {
    const filter = byExt(".txt");

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/UnicodeData.txt") })).toBe(true);
  });

  it("should not match different extensions", () => {
    const filter = byExt(".txt");

    expect(filter({ file: createFile("ReadMe.html") })).toBe(false);
    expect(filter({ file: createFile("emoji-data.json") })).toBe(false);
    expect(filter({ file: createFile("config.xml") })).toBe(false);
  });

  it("should handle extension with or without dot", () => {
    const filterWithDot = byExt(".json");
    const filterWithoutDot = byExt("json");

    expect(filterWithDot({ file: createFile("data.json") })).toBe(true);
    expect(filterWithoutDot({ file: createFile("data.json") })).toBe(true);
  });

  it("should match files without extension", () => {
    const filter = byExt("");

    expect(filter({ file: createFile("Makefile") })).toBe(true);
    expect(filter({ file: createFile("LICENSE") })).toBe(true);
  });
});

describe("byPath", () => {
  it("should match exact path", () => {
    const filter = byPath("ucd/LineBreak.txt");

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
  });

  it("should not match different paths", () => {
    const filter = byPath("ucd/LineBreak.txt");

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("ucd/WordBreak.txt") })).toBe(false);
  });

  it("should be case-sensitive", () => {
    const filter = byPath("ucd/LineBreak.txt");

    expect(filter({ file: createFile("UCD/LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("ucd/linebreak.txt") })).toBe(false);
  });
});

describe("byGlob", () => {
  it("should match files with glob pattern", () => {
    const filter = byGlob("**/*.txt");

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/UnicodeData.txt") })).toBe(true);
    expect(filter({ file: createFile("deep/nested/file.txt") })).toBe(true);
  });

  it("should not match non-matching files", () => {
    const filter = byGlob("**/*.txt");

    expect(filter({ file: createFile("ReadMe.html") })).toBe(false);
    expect(filter({ file: createFile("data.json") })).toBe(false);
  });

  it("should support directory-specific patterns", () => {
    const filter = byGlob("ucd/*.txt");

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("LineBreak.txt") })).toBe(false);
  });

  it("should support complex glob patterns", () => {
    const filter = byGlob("**/auxiliary/*Test*.txt");

    expect(filter({ file: createFile("auxiliary/WordBreakTest.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/auxiliary/LineBreakTest.txt") })).toBe(true);
    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(false);
  });

  it("should support negation patterns", () => {
    const filter = byGlob("!**/*.html");

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ReadMe.html") })).toBe(false);
  });

  it("should support brace expansion", () => {
    const filter = byGlob("**/*.{txt,json}");

    expect(filter({ file: createFile("data.txt") })).toBe(true);
    expect(filter({ file: createFile("config.json") })).toBe(true);
    expect(filter({ file: createFile("readme.html") })).toBe(false);
  });
});

describe("byProp", () => {
  it("should match rows with specific property", () => {
    const filter = byProp("Line_Break");

    expect(filter({
      file: createFile("test.txt"),
      row: { property: "Line_Break" },
    })).toBe(true);
  });

  it("should not match rows with different property", () => {
    const filter = byProp("Line_Break");

    expect(filter({
      file: createFile("test.txt"),
      row: { property: "Word_Break" },
    })).toBe(false);
  });

  it("should not match when row is undefined", () => {
    const filter = byProp("Line_Break");

    expect(filter({ file: createFile("test.txt") })).toBe(false);
  });

  it("should not match when row property is undefined", () => {
    const filter = byProp("Line_Break");

    expect(filter({
      file: createFile("test.txt"),
      row: {},
    })).toBe(false);
  });
});

describe("and", () => {
  it("should return true when all filters match", () => {
    const filter = and(byExt(".txt"), byDir("ucd"));

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
  });

  it("should return false when any filter does not match", () => {
    const filter = and(byExt(".txt"), byDir("ucd"));

    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("ucd/data.json") })).toBe(false);
  });

  it("should short-circuit evaluation", () => {
    let secondCalled = false;
    const filter = and(
      () => false,
      () => { secondCalled = true; return true; },
    );

    filter({ file: createFile("test.txt") });

    expect(secondCalled).toBe(false);
  });

  it("should handle multiple filters", () => {
    const filter = and(
      byExt(".txt"),
      byDir("ucd"),
      byName("LineBreak.txt"),
    );

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/WordBreak.txt") })).toBe(false);
  });

  it("should return true for empty filter list", () => {
    const filter = and();

    expect(filter({ file: createFile("any.txt") })).toBe(true);
  });
});

describe("or", () => {
  it("should return true when any filter matches", () => {
    const filter = or(byName("LineBreak.txt"), byName("WordBreak.txt"));

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("WordBreak.txt") })).toBe(true);
  });

  it("should return false when no filter matches", () => {
    const filter = or(byName("LineBreak.txt"), byName("WordBreak.txt"));

    expect(filter({ file: createFile("GraphemeBreak.txt") })).toBe(false);
  });

  it("should short-circuit evaluation", () => {
    let secondCalled = false;
    const filter = or(
      () => true,
      () => { secondCalled = true; return false; },
    );

    filter({ file: createFile("test.txt") });

    expect(secondCalled).toBe(false);
  });

  it("should handle multiple filters", () => {
    const filter = or(
      byName("LineBreak.txt"),
      byName("WordBreak.txt"),
      byName("GraphemeBreak.txt"),
    );

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("WordBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("GraphemeBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("SentenceBreak.txt") })).toBe(false);
  });

  it("should return false for empty filter list", () => {
    const filter = or();

    expect(filter({ file: createFile("any.txt") })).toBe(false);
  });
});

describe("not", () => {
  it("should negate the filter result", () => {
    const filter = not(byName("LineBreak.txt"));

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("WordBreak.txt") })).toBe(true);
  });

  it("should work with complex filters", () => {
    const filter = not(and(byExt(".txt"), byDir("ucd")));

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("auxiliary/LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/data.json") })).toBe(true);
  });
});

describe("always", () => {
  it("should always return true", () => {
    const filter = always();

    expect(filter({ file: createFile("any.txt") })).toBe(true);
    expect(filter({ file: createFile("ucd/data.json") })).toBe(true);
    expect(filter({ file: createFile("deep/nested/path.xml") })).toBe(true);
  });
});

describe("never", () => {
  it("should always return false", () => {
    const filter = never();

    expect(filter({ file: createFile("any.txt") })).toBe(false);
    expect(filter({ file: createFile("ucd/data.json") })).toBe(false);
    expect(filter({ file: createFile("deep/nested/path.xml") })).toBe(false);
  });
});

describe("filter composition", () => {
  it("should support complex compositions", () => {
    const filter = or(
      and(byDir("ucd"), byExt(".txt")),
      and(byDir("auxiliary"), byGlob("**/*Test*.txt")),
    );

    expect(filter({ file: createFile("ucd/LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("auxiliary/WordBreakTest.txt") })).toBe(true);
    expect(filter({ file: createFile("auxiliary/data.txt") })).toBe(false);
    expect(filter({ file: createFile("other/file.txt") })).toBe(false);
  });

  it("should support exclusion patterns", () => {
    const filter = and(
      byExt(".txt"),
      not(byGlob("**/*Test*.txt")),
    );

    expect(filter({ file: createFile("LineBreak.txt") })).toBe(true);
    expect(filter({ file: createFile("TestLineBreak.txt") })).toBe(false);
    expect(filter({ file: createFile("ucd/WordBreakTest.txt") })).toBe(false);
  });

  it("should support version-aware filtering", () => {
    const filter = and(
      byName("UnicodeData.txt"),
      (ctx) => ctx.file.version === "16.0.0",
    );

    expect(filter({ file: createFile("UnicodeData.txt", "16.0.0") })).toBe(true);
    expect(filter({ file: createFile("UnicodeData.txt", "15.1.0") })).toBe(false);
  });
});
