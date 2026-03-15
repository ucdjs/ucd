import type { ApiError, UnicodeFileTreeNode } from "@ucdjs/schemas";
import { describe, expect, it } from "vitest";
import {
  createConcurrencyLimiter,
  createGlobMatcher,
  createPathFilter,
  findFileByPath,
  flattenFilePaths,
  getLatestStableUnicodeVersion,
  isApiError,
  isValidGlobPattern,
  isValidUnicodeVersion,
  normalizePathForFiltering,
  tryOr,
  wrapTry,
} from "../src/index";

describe("@ucdjs/utils", () => {
  it("re-exports path filtering helpers", () => {
    const filter = createPathFilter({
      include: ["**/*.txt"],
      exclude: ["**/ReadMe.txt"],
    });

    expect(filter("Blocks.txt")).toBe(true);
    expect(filter("ReadMe.txt")).toBe(false);
  });

  it("re-exports glob helpers", () => {
    const matcher = createGlobMatcher("auxiliary/**/*.txt");

    expect(matcher("auxiliary/GraphemeBreakProperty.txt")).toBe(true);
    expect(matcher("emoji/emoji-data.txt")).toBe(false);
    expect(isValidGlobPattern("auxiliary/**/*.txt")).toBe(true);
  });

  it("re-exports file tree helpers", () => {
    const tree: UnicodeFileTreeNode[] = [
      {
        type: "directory",
        name: "auxiliary",
        path: "/16.0.0/ucd/auxiliary/",
        lastModified: null,
        children: [
          {
            type: "file",
            name: "GraphemeBreakProperty.txt",
            path: "/16.0.0/ucd/auxiliary/GraphemeBreakProperty.txt",
            lastModified: null,
          },
        ],
      },
    ];

    expect(normalizePathForFiltering("16.0.0", "/16.0.0/ucd/Blocks.txt")).toBe("Blocks.txt");
    expect(findFileByPath(tree, "/16.0.0/ucd/auxiliary/GraphemeBreakProperty.txt")?.name).toBe("GraphemeBreakProperty.txt");
    expect(flattenFilePaths(tree)).toEqual(["/16.0.0/ucd/auxiliary/GraphemeBreakProperty.txt"]);
  });

  it("re-exports async helpers", async () => {
    const limiter = createConcurrencyLimiter(1);
    const limited = await limiter(async (value: number) => value * 2, 5);
    expect(limited).toBe(10);

    expect(wrapTry(() => "ok")).toEqual(["ok", null]);

    const recovered = await tryOr({
      try: async () => {
        throw new Error("broken");
      },
      err: () => "fallback",
    });

    expect(recovered).toBe("fallback");
  });

  it("re-exports safe domain helpers", () => {
    const apiError = {
      message: "Bad Request",
      status: 400,
      timestamp: "2026-03-15T00:00:00.000Z",
    } satisfies ApiError;

    expect(isApiError(apiError)).toBe(true);
    expect(isValidUnicodeVersion("16.0.0")).toBe(true);
    expect(getLatestStableUnicodeVersion()).toBeTypeOf("string");
  });
});
