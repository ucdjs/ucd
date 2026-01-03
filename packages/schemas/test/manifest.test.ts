/// <reference types="../../test-utils/src/matchers/types.d.ts" />

import { describe, expect, it } from "vitest";
import { UCDStoreVersionManifestSchema } from "../src/manifest";

// eslint-disable-next-line test/prefer-lowercase-title
describe("UCDStoreVersionManifestSchema", () => {
  it("should validate a manifest with expected files", () => {
    const validManifest = {
      expectedFiles: [
        "UnicodeData.txt",
        "PropList.txt",
        "DerivedAge.txt",
      ],
    };
    expect(validManifest).toMatchSchema({
      schema: UCDStoreVersionManifestSchema,
      success: true,
      data: {
        expectedFiles: [
          "UnicodeData.txt",
          "PropList.txt",
          "DerivedAge.txt",
        ],
      },
    });
  });

  it("should validate a manifest with empty files array", () => {
    const emptyManifest = {
      expectedFiles: [],
    };
    expect(emptyManifest).toMatchSchema({
      schema: UCDStoreVersionManifestSchema,
      success: true,
      data: {
        expectedFiles: [],
      },
    });
  });

  it("should validate manifest with nested paths", () => {
    const manifestWithPaths = {
      expectedFiles: [
        "UnicodeData.txt",
        "extracted/DerivedAge.txt",
        "extracted/emoji/emoji-data.txt",
      ],
    };
    expect(manifestWithPaths).toMatchSchema({
      schema: UCDStoreVersionManifestSchema,
      success: true,
    });
  });

  it("should reject missing expectedFiles", () => {
    const invalidManifest = {};
    expect(invalidManifest).toMatchSchema({
      schema: UCDStoreVersionManifestSchema,
      success: false,
    });
  });

  it("should reject non-array expectedFiles", () => {
    const invalidManifest = {
      expectedFiles: "UnicodeData.txt",
    };
    expect(invalidManifest).toMatchSchema({
      schema: UCDStoreVersionManifestSchema,
      success: false,
    });
  });

  it("should reject expectedFiles with non-string elements", () => {
    const invalidManifest = {
      expectedFiles: [
        "UnicodeData.txt",
        123, // should be string
        "PropList.txt",
      ],
    };
    expect(invalidManifest).toMatchSchema({
      schema: UCDStoreVersionManifestSchema,
      success: false,
    });
  });
});
