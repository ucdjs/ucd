import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { describe, expect, it } from "vitest";
import { LockfileInvalidError } from "../src/errors";
import { canUseLockfile, readLockfile, readLockfileOrUndefined, validateLockfile, writeLockfile } from "../src/lockfile";

describe("validateLockfile", () => {
  it("should validate a valid lockfile", () => {
    const validLockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 100,
          totalSize: 50000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    };

    const result = validateLockfile(validLockfile);

    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.lockfileVersion).toBe(1);
    expect(result.data?.createdAt).toBeInstanceOf(Date);
    expect(result.data?.updatedAt).toBeInstanceOf(Date);
    expect(result.errors).toBeUndefined();
  });

  it("should validate a lockfile with optional filters", () => {
    const lockfileWithFilters = {
      lockfileVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {
        "15.1.0": {
          path: "15.1.0/snapshot.json",
          fileCount: 50,
          totalSize: 25000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      filters: {
        include: ["*.txt"],
        exclude: ["*.zip"],
        disableDefaultExclusions: true,
      },
    };

    const result = validateLockfile(lockfileWithFilters);

    expect(result.valid).toBe(true);
    expect(result.data?.filters?.include).toEqual(["*.txt"]);
    expect(result.data?.filters?.exclude).toEqual(["*.zip"]);
    expect(result.data?.filters?.disableDefaultExclusions).toBe(true);
  });

  it("should validate a lockfile without filters", () => {
    const lockfileWithoutFilters = {
      lockfileVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
    };

    const result = validateLockfile(lockfileWithoutFilters);

    expect(result.valid).toBe(true);
    expect(result.data?.filters).toBeUndefined();
  });

  it("should reject invalid lockfileVersion", () => {
    const invalidLockfile = {
      lockfileVersion: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
    };

    const result = validateLockfile(invalidLockfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("should reject missing required fields", () => {
    const incompleteLockfile = {
      lockfileVersion: 1,
      versions: {},
    };

    const result = validateLockfile(incompleteLockfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should reject invalid date formats", () => {
    const invalidDateLockfile = {
      lockfileVersion: 1,
      createdAt: "not-a-date",
      updatedAt: new Date(),
      versions: {},
    };

    const result = validateLockfile(invalidDateLockfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should reject negative fileCount", () => {
    const invalidLockfile = {
      lockfileVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: -1,
          totalSize: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    const result = validateLockfile(invalidLockfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should coerce date strings to Date objects", () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-06-15T10:30:00.000Z",
      updatedAt: "2024-06-16T10:30:00.000Z",
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 10,
          totalSize: 1000,
          createdAt: "2024-06-15T10:30:00.000Z",
          updatedAt: "2024-06-15T10:30:00.000Z",
        },
      },
    };

    const result = validateLockfile(lockfile);

    expect(result.valid).toBe(true);
    expect(result.data?.createdAt).toBeInstanceOf(Date);
    expect(result.data?.updatedAt).toBeInstanceOf(Date);
    expect(result.data?.versions["16.0.0"]?.createdAt).toBeInstanceOf(Date);
    expect(result.data?.versions["16.0.0"]?.updatedAt).toBeInstanceOf(Date);
  });

  it("should coerce timestamps to Date objects", () => {
    const timestamp = Date.now();
    const lockfile = {
      lockfileVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 10,
          totalSize: 1000,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
    };

    const result = validateLockfile(lockfile);

    expect(result.valid).toBe(true);
    expect(result.data?.createdAt).toBeInstanceOf(Date);
  });

  it("should accept partial filters", () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
      filters: {
        include: ["*.txt"],
        // exclude and disableDefaultExclusions are optional
      },
    };

    const result = validateLockfile(lockfile);

    expect(result.valid).toBe(true);
    expect(result.data?.filters?.include).toEqual(["*.txt"]);
    expect(result.data?.filters?.exclude).toBeUndefined();
    expect(result.data?.filters?.disableDefaultExclusions).toBeUndefined();
  });
});

describe("readLockfile", () => {
  const validLockfileData = {
    lockfileVersion: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    versions: {
      "16.0.0": {
        path: "16.0.0/snapshot.json",
        fileCount: 100,
        totalSize: 50000,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  };

  it("should read and parse a valid lockfile", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": JSON.stringify(validLockfileData),
      },
    });

    const lockfile = await readLockfile(fs, ".ucd-store.lock");
    expect(lockfile.lockfileVersion).toBe(1);
    expect(lockfile.createdAt).toBeInstanceOf(Date);
    expect(lockfile.updatedAt).toBeInstanceOf(Date);
    expect(lockfile.versions["16.0.0"]).toBeDefined();
    expect(lockfile.versions["16.0.0"]?.fileCount).toBe(100);
  });

  it("should throw LockfileInvalidError when lockfile is empty", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": "",
      },
    });

    // TODO: make use of the toMatchError here.
    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow(LockfileInvalidError);
    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow("lockfile is empty");
  });

  it("should throw LockfileInvalidError when lockfile is not valid JSON", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": "not valid json {",
      },
    });

    // TODO: make use of the toMatchError here.
    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow(LockfileInvalidError);
    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow("lockfile is not valid JSON");
  });

  it("should throw LockfileInvalidError when lockfile does not match schema", async () => {
    const invalidLockfile = {
      lockfileVersion: 999,
      versions: {},
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": JSON.stringify(invalidLockfile),
      },
    });

    // TODO: make use of the toMatchError here.
    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow(LockfileInvalidError);
    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow("lockfile does not match expected schema");
  });

  it("should throw LockfileInvalidError when lockfile does not exist", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    await expect(readLockfile(fs, ".ucd-store.lock")).rejects.toThrow(LockfileInvalidError);
  });

  it("should correctly coerce dates from JSON strings", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": JSON.stringify(validLockfileData),
      },
    });

    const lockfile = await readLockfile(fs, ".ucd-store.lock");

    expect(lockfile.createdAt).toBeInstanceOf(Date);
    expect(lockfile.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(lockfile.versions["16.0.0"]?.createdAt).toBeInstanceOf(Date);
  });
});

describe("writeLockfile", () => {
  it("should write a lockfile to the filesystem", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    const lockfile = {
      lockfileVersion: 1 as const,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 100,
          totalSize: 50000,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      },
    };

    await writeLockfile(fs, ".ucd-store.lock", lockfile);

    const content = await fs.read(".ucd-store.lock");
    expect(content).toBeDefined();

    const parsed = JSON.parse(content!);
    expect(parsed.lockfileVersion).toBe(1);
    expect(parsed.versions["16.0.0"].fileCount).toBe(100);
  });

  it("should write lockfile with pretty formatting", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    const lockfile = {
      lockfileVersion: 1 as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
    };

    await writeLockfile(fs, ".ucd-store.lock", lockfile);

    const content = await fs.read(".ucd-store.lock");
    expect(content).toContain("\n");
    expect(content).toContain("  ");
  });

  it("should skip writing when filesystem does not support write operations", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
      functions: {
        write: false,
      },
    });

    const lockfile = {
      lockfileVersion: 1 as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
    };

    // Should not throw, just skip
    await expect(writeLockfile(fs, ".ucd-store.lock", lockfile)).resolves.toBeUndefined();

    // File should not exist
    const exists = await fs.exists(".ucd-store.lock");
    expect(exists).toBe(false);
  });

  it("should write lockfile with filters", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    const lockfile = {
      lockfileVersion: 1 as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: {},
      filters: {
        include: ["*.txt"],
        exclude: ["*.zip"],
      },
    };

    await writeLockfile(fs, ".ucd-store.lock", lockfile);

    const content = await fs.read(".ucd-store.lock");
    const parsed = JSON.parse(content!);
    expect(parsed.filters.include).toEqual(["*.txt"]);
    expect(parsed.filters.exclude).toEqual(["*.zip"]);
  });
});

describe("readLockfileOrUndefined", () => {
  it("should read a valid lockfile", async () => {
    const validLockfileData = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {},
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": JSON.stringify(validLockfileData),
      },
    });

    const lockfile = await readLockfileOrUndefined(fs, ".ucd-store.lock");

    expect(lockfile).toBeDefined();
    expect(lockfile?.lockfileVersion).toBe(1);
  });

  it("should return undefined when lockfile does not exist", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    const lockfile = await readLockfileOrUndefined(fs, ".ucd-store.lock");

    expect(lockfile).toBeUndefined();
  });

  it("should return undefined when lockfile is invalid", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": "not valid json",
      },
    });

    const lockfile = await readLockfileOrUndefined(fs, ".ucd-store.lock");

    expect(lockfile).toBeUndefined();
  });

  it("should return undefined when lockfile does not match schema", async () => {
    const invalidLockfile = {
      lockfileVersion: 999,
      versions: {},
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        ".ucd-store.lock": JSON.stringify(invalidLockfile),
      },
    });

    const lockfile = await readLockfileOrUndefined(fs, ".ucd-store.lock");

    expect(lockfile).toBeUndefined();
  });
});

describe("canUseLockfile", () => {
  it("should return true when filesystem supports write operations", () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    expect(canUseLockfile(fs)).toBe(true);
  });

  it("should return false when filesystem does not support write operations", () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
      functions: {
        write: false,
      },
    });

    expect(canUseLockfile(fs)).toBe(false);
  });
});
