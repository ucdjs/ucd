/// <reference types="../../test-utils/src/matchers/types.d.ts" />

import { describe, expect, it } from "vitest";
import {
  BackendEntryListSchema,
  BackendEntrySchema,
  FileEntryListSchema,
  FileEntrySchema,
} from "../src/fs";

// eslint-disable-next-line test/prefer-lowercase-title
describe("FileEntrySchema", () => {
  it("should validate a directory entry", () => {
    const validDirectory = {
      name: "docs",
      path: "/docs/",
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
        path: "/folder/",
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
describe("BackendEntrySchema", () => {
  it("should validate a backend file entry without lastModified", () => {
    const validEntry = {
      name: "README.md",
      path: "/docs/README.md",
      type: "file",
    };

    expect(validEntry).toMatchSchema({
      schema: BackendEntrySchema,
      success: true,
      data: {
        type: "file",
        name: "README.md",
      },
    });
  });

  it("should validate a recursive backend directory entry", () => {
    const validEntry = {
      name: "docs",
      path: "/docs/",
      type: "directory",
      children: [
        {
          name: "README.md",
          path: "/docs/README.md",
          type: "file",
        },
      ],
    };

    expect(validEntry).toMatchSchema({
      schema: BackendEntrySchema,
      success: true,
    });
  });

  it("should default backend directory children to an empty array", () => {
    const validEntry = {
      name: "docs",
      path: "/docs/",
      type: "directory",
    };

    expect(validEntry).toMatchSchema({
      schema: BackendEntrySchema,
      success: true,
      data: {
        type: "directory",
        name: "docs",
        children: [],
      },
    });
  });

  it("should allow store-style backend entries with lastModified", () => {
    const validEntry = {
      name: "README.md",
      path: "/docs/README.md",
      type: "file",
      lastModified: Date.now(),
    };

    expect(validEntry).toMatchSchema({
      schema: BackendEntrySchema,
      success: true,
      data: {
        type: "file",
        name: "README.md",
      },
    });
  });

  it("should reject backend entries without leading slash", () => {
    const invalidEntry = {
      name: "README.md",
      path: "docs/README.md",
      type: "file",
    };

    expect(invalidEntry).toMatchSchema({
      schema: BackendEntrySchema,
      success: false,
    });
  });

  it("should reject backend directories without trailing slash", () => {
    const invalidEntry = {
      name: "docs",
      path: "/docs",
      type: "directory",
      children: [],
    };

    expect(invalidEntry).toMatchSchema({
      schema: BackendEntrySchema,
      success: false,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("BackendEntryListSchema", () => {
  it("should validate a list of backend entries", () => {
    const validList = [
      {
        name: "folder",
        path: "/folder/",
        type: "directory",
        children: [],
      },
      {
        name: "file.txt",
        path: "/file.txt",
        type: "file",
      },
    ];

    expect(validList).toMatchSchema({
      schema: BackendEntryListSchema,
      success: true,
    });
  });
});
