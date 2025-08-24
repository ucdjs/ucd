import { describe, expect, it } from "vitest";
import { FileEntrySchema, FileEntryListSchema } from "../src/fs";

// eslint-disable-next-line test/prefer-lowercase-title
describe("FileEntrySchema", () => {
  it("should validate a directory entry", () => {
    const validDirectory = {
      name: "docs",
      path: "/docs",
      lastModified: Date.now(),
      type: "directory",
    };
    const result = FileEntrySchema.safeParse(validDirectory);
    expect(result.success).toBe(true);
  });

  it("should validate a file entry", () => {
    const validFile = {
      name: "README.md",
      path: "/docs/README.md",
      lastModified: Date.now(),
      type: "file",
    };
    const result = FileEntrySchema.safeParse(validFile);
    expect(result.success).toBe(true);
  });

  it("should invalidate an entry with missing fields", () => {
    const invalidEntry = {
      name: "README.md",
      path: "/docs/README.md",
    };
    const result = FileEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });
});

describe("FileEntryListSchema", () => {
  it("should validate a list of file entries", () => {
    const validEntries = [
      {
        name: "docs",
        path: "/docs",
        lastModified: Date.now(),
        type: "directory",
      },
      {
        name: "README.md",
        path: "/README.md",
        lastModified: Date.now(),
        type: "file",
      },
    ];
    const result = FileEntryListSchema.safeParse(validEntries);
    expect(result.success).toBe(true);
  });

  it("should validate an empty list", () => {
    const emptyList: any[] = [];
    const result = FileEntryListSchema.safeParse(emptyList);
    expect(result.success).toBe(true);
  });

  it("should invalidate a list with invalid entries", () => {
    const invalidEntries = [
      {
        name: "README.md",
        path: "/README.md",
        // missing lastModified and type
      },
    ];
    const result = FileEntryListSchema.safeParse(invalidEntries);
    expect(result.success).toBe(false);
  });
});
