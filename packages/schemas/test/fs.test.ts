import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FileEntrySchema } from "../src/fs";

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
