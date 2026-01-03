/// <reference types="../../test-utils/src/matchers/types.d.ts" />

import { describe, expect, it } from "vitest";
import { LockfileSchema, SnapshotSchema } from "../src/lockfile";

// eslint-disable-next-line test/prefer-lowercase-title
describe("LockfileSchema", () => {
  it("should validate a minimal lockfile", () => {
    const validLockfile = {
      lockfileVersion: 1,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      versions: {},
    };
    expect(validLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: true,
    });
  });

  it("should validate a lockfile with versions", () => {
    const validLockfile = {
      lockfileVersion: 1,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
      versions: {
        "16.0.0": {
          path: "snapshots/16.0.0.json",
          fileCount: 42,
          totalSize: 1024000,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        "15.1.0": {
          path: "snapshots/15.1.0.json",
          fileCount: 40,
          totalSize: 1000000,
          createdAt: new Date("2023-09-12T00:00:00Z"),
          updatedAt: new Date("2023-09-12T00:00:00Z"),
        },
      },
    };
    expect(validLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: true,
    });
  });

  it("should validate a lockfile with filters", () => {
    const validLockfile = {
      lockfileVersion: 1,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      versions: {},
      filters: {
        include: ["*.txt"],
        exclude: ["*.zip", "*.pdf"],
        disableDefaultExclusions: false,
      },
    };
    expect(validLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: true,
    });
  });

  it("should coerce date strings to Date objects", () => {
    const lockfileWithStringDates = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      versions: {
        "16.0.0": {
          path: "snapshots/16.0.0.json",
          fileCount: 42,
          totalSize: 1024000,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      },
    };
    expect(lockfileWithStringDates).toMatchSchema({
      schema: LockfileSchema,
      success: true,
    });
  });

  it("should coerce timestamps to Date objects", () => {
    const lockfileWithTimestamps = {
      lockfileVersion: 1,
      createdAt: 1704067200000,
      updatedAt: 1704153600000,
      versions: {
        "16.0.0": {
          path: "snapshots/16.0.0.json",
          fileCount: 42,
          totalSize: 1024000,
          createdAt: 1704067200000,
          updatedAt: 1704067200000,
        },
      },
    };
    expect(lockfileWithTimestamps).toMatchSchema({
      schema: LockfileSchema,
      success: true,
    });
  });

  it("should reject invalid lockfile version", () => {
    const invalidLockfile = {
      lockfileVersion: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
    };
    expect(invalidLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: false,
    });
  });

  it("should reject negative file counts", () => {
    const invalidLockfile = {
      lockfileVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {
        "16.0.0": {
          path: "snapshots/16.0.0.json",
          fileCount: -1,
          totalSize: 1024000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
    expect(invalidLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: false,
    });
  });

  it("should reject negative total sizes", () => {
    const invalidLockfile = {
      lockfileVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {
        "16.0.0": {
          path: "snapshots/16.0.0.json",
          fileCount: 42,
          totalSize: -1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
    expect(invalidLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: false,
    });
  });

  it("should reject missing required fields", () => {
    const invalidLockfile = {
      lockfileVersion: 1,
      createdAt: new Date(),
      // missing updatedAt
      versions: {},
    };
    expect(invalidLockfile).toMatchSchema({
      schema: LockfileSchema,
      success: false,
    });
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("SnapshotSchema", () => {
  it("should validate a snapshot with files", () => {
    const validSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          fileHash: "sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
          size: 1024,
        },
        "PropList.txt": {
          hash: "sha256:abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          fileHash: "sha256:dcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcba",
          size: 2048,
        },
      },
    };
    expect(validSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: true,
      data: {
        unicodeVersion: "16.0.0",
      },
    });
  });

  it("should validate an empty snapshot", () => {
    const validSnapshot = {
      unicodeVersion: "16.0.0",
      files: {},
    };
    expect(validSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: true,
    });
  });

  it("should reject invalid hash format (missing prefix)", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          fileHash: "sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
          size: 1024,
        },
      },
    };
    expect(invalidSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: false,
    });
  });

  it("should reject invalid hash format (wrong length)", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:0123456789abcdef",
          fileHash: "sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
          size: 1024,
        },
      },
    };
    expect(invalidSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: false,
    });
  });

  it("should reject invalid hash format (uppercase)", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
          fileHash: "sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
          size: 1024,
        },
      },
    };
    expect(invalidSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: false,
    });
  });

  it("should reject negative file sizes", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          fileHash: "sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
          size: -1024,
        },
      },
    };
    expect(invalidSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: false,
    });
  });

  it("should reject missing required fields", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          // missing fileHash
          size: 1024,
        },
      },
    };
    expect(invalidSnapshot).toMatchSchema({
      schema: SnapshotSchema,
      success: false,
    });
  });
});
