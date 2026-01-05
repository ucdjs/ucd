/// <reference types="../../test-utils/src/matchers/types.d.ts" />

import { describe, expect, it } from "vitest";
import { FileEntryListSchema, FileEntrySchema, UCDStoreManifestSchema } from "../src/fs";

// eslint-disable-next-line test/prefer-lowercase-title
describe("FileEntrySchema", () => {
  it("should validate a directory entry", () => {
    const validDirectory = {
      name: "docs",
      path: "/docs",
      lastModified: Date.now(),
      type: "directory",
    };
    expect(validDirectory).toMatchSchema({
      schema: FileEntrySchema,
      success: true,
      data: {
        type: "directory",
        name: "docs",
      },
    });
  });

  it("should validate a file entry", () => {
    const validFile = {
      name: "README.md",
      path: "/docs/README.md",
      lastModified: Date.now(),
      type: "file",
    };
    expect(validFile).toMatchSchema({
      schema: FileEntrySchema,
      success: true,
      data: {
        type: "file",
        name: "README.md",
      },
    });
  });

  it("should invalidate an entry with missing fields", () => {
    const invalidEntry = {
      name: "README.md",
      path: "/docs/README.md",
    };
    expect(invalidEntry).toMatchSchema({
      schema: FileEntrySchema,
      success: false,
    });
  });

  it("should invalidate an entry with invalid type", () => {
    const invalidEntry = {
      name: "README.md",
      path: "/docs/README.md",
      lastModified: Date.now(),
      type: "symlink", // invalid type
    };
    expect(invalidEntry).toMatchSchema({
      schema: FileEntrySchema,
      success: false,
    });
  });

  it("should reject entry without name", () => {
    const invalidEntry = {
      path: "/docs/README.md",
      lastModified: Date.now(),
      type: "file",
    };
    const result = FileEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });

  it("should reject entry without path", () => {
    const invalidEntry = {
      name: "README.md",
      lastModified: Date.now(),
      type: "file",
    };
    const result = FileEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("FileEntryListSchema", () => {
  it("should validate a list of file entries", () => {
    const validList = [
      {
        name: "file1.txt",
        path: "/file1.txt",
        lastModified: Date.now(),
        type: "file",
      },
      {
        name: "folder",
        path: "/folder",
        lastModified: Date.now(),
        type: "directory",
      },
    ];
    expect(validList).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });
  });

  it("should validate an empty list", () => {
    expect([]).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });
  });

  it("should reject list with invalid entries", () => {
    const invalidList = [
      {
        name: "file1.txt",
        path: "/file1.txt",
        lastModified: Date.now(),
        type: "file",
      },
      {
        name: "invalid",
        // missing required fields
      },
    ];
    expect(invalidList).toMatchSchema({
      schema: FileEntryListSchema,
      success: false,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("UCDStoreManifestSchema", () => {
  it("should validate a manifest with multiple versions", () => {
    const validManifest = {
      "16.0.0": {
        expectedFiles: ["UnicodeData.txt", "PropList.txt"],
      },
      "15.1.0": {
        expectedFiles: ["UnicodeData.txt"],
      },
    };
    expect(validManifest).toMatchSchema({
      schema: UCDStoreManifestSchema,
      success: true,
    });
  });

  it("should use default empty array when expectedFiles is missing", () => {
    const manifestWithDefaults = {
      "16.0.0": {},
    };
    expect(manifestWithDefaults).toMatchSchema({
      schema: UCDStoreManifestSchema,
      success: true,
    });
  });

  it("should validate empty manifest", () => {
    const emptyManifest = {};
    expect(emptyManifest).toMatchSchema({
      schema: UCDStoreManifestSchema,
      success: true,
    });
  });

  it("should validate manifest with version that has empty expectedFiles", () => {
    const manifest = {
      "16.0.0": {
        expectedFiles: [],
      },
    };
    expect(manifest).toMatchSchema({
      schema: UCDStoreManifestSchema,
      success: true,
    });
  });

  it("should reject manifest with invalid expectedFiles type", () => {
    const invalidManifest = {
      "16.0.0": {
        expectedFiles: "not-an-array",
      },
    };
    expect(invalidManifest).toMatchSchema({
      schema: UCDStoreManifestSchema,
      success: false,
    });
  });

  it("should validate manifest with nested file paths", () => {
    const manifest = {
      "16.0.0": {
        expectedFiles: [
          "UnicodeData.txt",
          "extracted/DerivedAge.txt",
          "extracted/emoji/emoji-data.txt",
        ],
      },
    };
    expect(manifest).toMatchSchema({
      schema: UCDStoreManifestSchema,
      success: true,
    });
  });
});
