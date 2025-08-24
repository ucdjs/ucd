import { describe, expect, it } from "vitest";
import { UnicodeVersionSchema, UnicodeVersionListSchema } from "../src/version";

describe("UnicodeVersionSchema", () => {
  it("should validate a valid unicode version", () => {
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

  it("should validate a draft version with null date", () => {
    const draftVersion = {
      version: "17.0.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
      date: null,
      url: "https://www.unicode.org/Public/17.0.0",
      mappedUcdVersion: null,
      type: "draft",
    };
    const result = UnicodeVersionSchema.safeParse(draftVersion);
    expect(result.success).toBe(true);
  });

  it("should invalidate a version with invalid date format", () => {
    const invalidVersion = {
      version: "15.1.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
      date: "invalid-date",
      url: "https://www.unicode.org/Public/15.1.0/ucd/",
      mappedUcdVersion: null,
      type: "stable",
    };
    const result = UnicodeVersionSchema.safeParse(invalidVersion);
    expect(result.success).toBe(false);
  });

  it("should invalidate a version with invalid type", () => {
    const invalidVersion = {
      version: "15.1.0",
      documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
      date: "2023",
      url: "https://www.unicode.org/Public/15.1.0/ucd/",
      mappedUcdVersion: null,
      type: "invalid-type",
    };
    const result = UnicodeVersionSchema.safeParse(invalidVersion);
    expect(result.success).toBe(false);
  });
});

describe("UnicodeVersionListSchema", () => {
  it("should validate a list of unicode versions", () => {
    const versionList = [
      {
        version: "15.1.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
        date: "2023",
        url: "https://www.unicode.org/Public/15.1.0/ucd/",
        mappedUcdVersion: null,
        type: "stable",
      },
      {
        version: "15.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode15.0.0/",
        date: "2022",
        url: "https://www.unicode.org/Public/15.0.0/ucd/",
        mappedUcdVersion: null,
        type: "stable",
      },
    ];
    const result = UnicodeVersionListSchema.safeParse(versionList);
    expect(result.success).toBe(true);
  });

  it("should validate an empty list", () => {
    const emptyList: any[] = [];
    const result = UnicodeVersionListSchema.safeParse(emptyList);
    expect(result.success).toBe(true);
  });
});