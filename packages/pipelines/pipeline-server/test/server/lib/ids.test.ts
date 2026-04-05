import { fileIdFromPath, fileLabelFromPath, sanitizeSegment, stripSuffixes } from "#server/lib/ids";
import { describe, expect, it } from "vitest";

describe("stripSuffixes", () => {
  it("strips .ucd-pipeline.ts suffix", () => {
    expect(stripSuffixes("alpha.ucd-pipeline.ts")).toBe("alpha");
  });

  it("strips .ts suffix when no .ucd-pipeline.ts match", () => {
    expect(stripSuffixes("helper.ts")).toBe("helper");
  });

  it("prefers .ucd-pipeline.ts over .ts", () => {
    expect(stripSuffixes("foo.ucd-pipeline.ts")).toBe("foo");
  });

  it("returns the original string when no suffix matches", () => {
    expect(stripSuffixes("readme.md")).toBe("readme.md");
  });

  it("supports custom suffixes", () => {
    expect(stripSuffixes("data.json", [".json"])).toBe("data");
  });
});

describe("sanitizeSegment", () => {
  it("replaces tildes with hyphens", () => {
    expect(sanitizeSegment("a~b~c")).toBe("a-b-c");
  });

  it("replaces whitespace with hyphens", () => {
    expect(sanitizeSegment("hello world")).toBe("hello-world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeSegment("  spaced  ")).toBe("spaced");
  });

  it("returns plain segments unchanged", () => {
    expect(sanitizeSegment("simple")).toBe("simple");
  });
});

describe("fileIdFromPath", () => {
  it("derives id from a simple pipeline filename", () => {
    expect(fileIdFromPath("alpha.ucd-pipeline.ts")).toBe("alpha");
  });

  it("joins directory segments with ~", () => {
    expect(fileIdFromPath("nested/deep.ucd-pipeline.ts")).toBe("nested~deep");
  });

  it("handles deeply nested paths", () => {
    expect(fileIdFromPath("a/b/c/file.ucd-pipeline.ts")).toBe("a~b~c~file");
  });

  it("normalizes backslashes to forward slashes", () => {
    expect(fileIdFromPath("nested\\deep.ucd-pipeline.ts")).toBe("nested~deep");
  });

  it("strips leading ./", () => {
    expect(fileIdFromPath("./alpha.ucd-pipeline.ts")).toBe("alpha");
  });

  it("collapses duplicate slashes", () => {
    expect(fileIdFromPath("nested//deep.ucd-pipeline.ts")).toBe("nested~deep");
  });

  it("sanitizes tildes in directory segments", () => {
    expect(fileIdFromPath("dir~name/file.ucd-pipeline.ts")).toBe("dir-name~file");
  });

  it("returns empty string for empty path", () => {
    expect(fileIdFromPath("")).toBe("");
  });
});

describe("fileLabelFromPath", () => {
  it("derives label from a simple pipeline filename", () => {
    expect(fileLabelFromPath("alpha.ucd-pipeline.ts")).toBe("alpha");
  });

  it("joins directory segments with /", () => {
    expect(fileLabelFromPath("nested/deep.ucd-pipeline.ts")).toBe("nested/deep");
  });

  it("handles deeply nested paths", () => {
    expect(fileLabelFromPath("a/b/c/file.ucd-pipeline.ts")).toBe("a/b/c/file");
  });

  it("normalizes backslashes to forward slashes", () => {
    expect(fileLabelFromPath("nested\\deep.ucd-pipeline.ts")).toBe("nested/deep");
  });

  it("strips leading ./", () => {
    expect(fileLabelFromPath("./alpha.ucd-pipeline.ts")).toBe("alpha");
  });

  it("returns empty string for empty path", () => {
    expect(fileLabelFromPath("")).toBe("");
  });
});
