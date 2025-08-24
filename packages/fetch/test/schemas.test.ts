import { describe, expect, it } from "vitest";
import {
  UCDStoreManifestSchema,
  FileEntrySchema,
  UnicodeVersionSchema,
  UnicodeTreeNodeSchema,
} from "../src";

describe("schema re-exports from @ucdjs/fetch", () => {
  it("should export schemas from @ucdjs/schemas", () => {
    expect(UCDStoreManifestSchema).toBeDefined();
    expect(FileEntrySchema).toBeDefined();
    expect(UnicodeVersionSchema).toBeDefined();
    expect(UnicodeTreeNodeSchema).toBeDefined();
  });

  it("should be able to use re-exported schemas", () => {
    const validFileEntry = {
      name: "test.txt",
      path: "/test.txt",
      lastModified: Date.now(),
      type: "file",
    };
    const result = FileEntrySchema.safeParse(validFileEntry);
    expect(result.success).toBe(true);
  });

  it("should be able to use unicode version schema", () => {
    const validVersion = {
      version: "15.1.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
      date: "2023",
      url: "https://www.unicode.org/Public/15.1.0/ucd/",
      mappedUcdVersion: null,
      type: "stable",
    };
    const result = UnicodeVersionSchema.safeParse(validVersion);
    expect(result.success).toBe(true);
  });
});