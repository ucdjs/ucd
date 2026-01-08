import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { readLockfile } from "@ucdjs/lockfile";
import { createEmptyLockfile, createLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../src/errors";
import { handleVersionConflict } from "../src/store";

describe("strict strategy", () => {
  it("should return lockfile versions when they match provided versions", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "15.0.0"]),
    });

    const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];
    const lockfileVersions = ["16.0.0", "15.1.0", "15.0.0"];

    const result = await handleVersionConflict(
      "strict",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(lockfileVersions);
  });

  it("should return lockfile versions when order differs but content matches", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "15.0.0"]),
    });

    const providedVersions = ["15.0.0", "16.0.0", "15.1.0"];
    const lockfileVersions = ["16.0.0", "15.1.0", "15.0.0"];

    const result = await handleVersionConflict(
      "strict",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(lockfileVersions);
  });

  it("should throw UCDStoreGenericError when versions differ", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "15.0.0"]),
    });

    const providedVersions = ["16.0.0", "15.1.0"];
    const lockfileVersions = ["16.0.0", "15.1.0", "15.0.0"];

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        lockfileVersions,
        fs,
        lockfilePath,
      ),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should include version mismatch details in error message", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "15.0.0"]),
    });

    const providedVersions = ["16.0.0", "15.1.0"];
    const lockfileVersions = ["16.0.0", "15.1.0", "15.0.0"];

    const error = await handleVersionConflict(
      "strict",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    ).catch((e) => e);

    expect(error).toBeInstanceOf(UCDStoreGenericError);
    expect(error.message).toContain("Version mismatch: lockfile has [16.0.0, 15.1.0, 15.0.0], provided [16.0.0, 15.1.0]. Use versionStrategy: \"merge\" or \"overwrite\" to resolve.");
  });
});

describe("merge strategy", () => {
  it("should combine provided and lockfile versions", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.0.0", "14.0.0"],
      lockfile: createEmptyLockfile(["15.0.0", "14.0.0"]),
    });

    const providedVersions = ["16.0.0", "15.1.0"];
    const lockfileVersions = ["15.0.0", "14.0.0"];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(["15.0.0", "14.0.0", "16.0.0", "15.1.0"]);

    const lockfile = await readLockfile(fs, lockfilePath);
    expect(Object.keys(lockfile.versions).sort()).toEqual(["14.0.0", "15.0.0", "15.1.0", "16.0.0"]);
  });

  it("should remove duplicate versions when merging", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.1.0", "15.0.0", "14.0.0"],
      lockfile: createEmptyLockfile(["15.1.0", "15.0.0", "14.0.0"]),
    });

    const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];
    const lockfileVersions = ["15.1.0", "15.0.0", "14.0.0"];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toHaveLength(4);
    expect(result).toContain("16.0.0");
    expect(result).toContain("15.1.0");
    expect(result).toContain("15.0.0");
    expect(result).toContain("14.0.0");

    const lockfile = await readLockfile(fs, lockfilePath);
    expect(Object.keys(lockfile.versions).sort()).toEqual(["14.0.0", "15.0.0", "15.1.0", "16.0.0"]);
  });

  it("should preserve existing lockfile entries when merging", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.0.0"],
      lockfile: createLockfile(["15.0.0"], {
        fileCounts: { "15.0.0": 10 },
        totalSizes: { "15.0.0": 1024 },
      }),
    });

    const providedVersions = ["16.0.0"];
    const lockfileVersions = ["15.0.0"];

    await handleVersionConflict(
      "merge",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    const lockfile = await readLockfile(fs, lockfilePath);

    // Existing entry should be preserved
    expect(lockfile.versions["15.0.0"]).toEqual({
      path: "15.0.0/snapshot.json",
      fileCount: 10,
      totalSize: 1024,
    });
    // New entry should have empty snapshot
    expect(lockfile.versions["16.0.0"]).toEqual({
      path: "16.0.0/snapshot.json",
      fileCount: 0,
      totalSize: 0,
    });
  });
});

describe("overwrite strategy", () => {
  it("should replace lockfile versions with provided versions", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.0.0", "14.0.0"],
      lockfile: createEmptyLockfile(["15.0.0", "14.0.0"]),
    });

    const providedVersions = ["16.0.0", "15.1.0"];
    const lockfileVersions = ["15.0.0", "14.0.0"];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(providedVersions);

    const lockfile = await readLockfile(fs, lockfilePath);
    expect(Object.keys(lockfile.versions).sort()).toEqual(["15.1.0", "16.0.0"]);
  });

  it("should preserve existing entries for versions that remain", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["16.0.0", "15.0.0"],
      lockfile: createLockfile(["16.0.0", "15.0.0"], {
        fileCounts: { "16.0.0": 10, "15.0.0": 8 },
        totalSizes: { "16.0.0": 1024, "15.0.0": 512 },
      }),
    });

    const providedVersions = ["16.0.0", "15.1.0"]; // Keep 16.0.0, replace 15.0.0 with 15.1.0
    const lockfileVersions = ["16.0.0", "15.0.0"];

    await handleVersionConflict(
      "overwrite",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    const lockfile = await readLockfile(fs, lockfilePath);

    // Existing entry for 16.0.0 should be preserved
    expect(lockfile.versions["16.0.0"]).toEqual({
      path: "16.0.0/snapshot.json",
      fileCount: 10,
      totalSize: 1024,
    });
    // 15.0.0 should be removed
    expect(lockfile.versions).not.toHaveProperty("15.0.0");
    // 15.1.0 should be added with empty snapshot
    expect(lockfile.versions["15.1.0"]).toEqual({
      path: "15.1.0/snapshot.json",
      fileCount: 0,
      totalSize: 0,
    });
  });
});

describe("empty provided versions array", () => {
  it("should throw error with strict strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.0.0"],
      lockfile: createEmptyLockfile(["15.0.0"]),
    });

    const providedVersions: string[] = [];
    const lockfileVersions = ["15.0.0"];

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        lockfileVersions,
        fs,
        lockfilePath,
      ),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should return lockfile versions with merge strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.0.0"],
      lockfile: createEmptyLockfile(["15.0.0"]),
    });

    const providedVersions: string[] = [];
    const lockfileVersions = ["15.0.0"];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(["15.0.0"]);
  });

  it("should clear lockfile with overwrite strategy", async () => {
    // Arrange
    const { fs, lockfilePath } = await createTestContext({
      versions: ["15.0.0"],
      lockfile: createEmptyLockfile(["15.0.0"]),
    });

    const providedVersions: string[] = [];
    const lockfileVersions = ["15.0.0"];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual([]);

    const lockfile = await readLockfile(fs, lockfilePath);
    expect(lockfile.versions).toEqual({});
  });
});

describe("empty lockfile versions array", () => {
  it("should throw error with strict strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: createEmptyLockfile([]),
    });

    const providedVersions = ["16.0.0"];
    const lockfileVersions: string[] = [];

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        lockfileVersions,
        fs,
        lockfilePath,
      ),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should return provided versions with merge strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: createEmptyLockfile([]),
    });

    const providedVersions = ["16.0.0"];
    const lockfileVersions: string[] = [];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(["16.0.0"]);

    const lockfile = await readLockfile(fs, lockfilePath);
    expect(Object.keys(lockfile.versions)).toEqual(["16.0.0"]);
  });

  it("should return provided versions with overwrite strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: createEmptyLockfile([]),
    });

    const providedVersions = ["16.0.0"];
    const lockfileVersions: string[] = [];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual(["16.0.0"]);

    const lockfile = await readLockfile(fs, lockfilePath);
    expect(Object.keys(lockfile.versions)).toEqual(["16.0.0"]);
  });
});

describe("both arrays empty", () => {
  it("should succeed with strict strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: createEmptyLockfile([]),
    });

    const providedVersions: string[] = [];
    const lockfileVersions: string[] = [];

    const result = await handleVersionConflict(
      "strict",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual([]);
  });

  it("should return empty array with merge strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: createEmptyLockfile([]),
    });

    const providedVersions: string[] = [];
    const lockfileVersions: string[] = [];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    // Assert
    expect(result).toEqual([]);
  });

  it("should return empty array with overwrite strategy", async () => {
    const { fs, lockfilePath } = await createTestContext({
      versions: [],
      lockfile: createEmptyLockfile([]),
    });

    const providedVersions: string[] = [];
    const lockfileVersions: string[] = [];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      lockfileVersions,
      fs,
      lockfilePath,
    );

    expect(result).toEqual([]);
  });
});
