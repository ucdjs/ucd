import { createMemoryMockFS, createReadOnlyBridge } from "#test-utils/fs-bridges";
import {
  canUseLockfile,
  getLockfilePath,
  LockfileInvalidError,
  readLockfile,
  readLockfileOrDefault,
  writeLockfile,
} from "@ucdjs/lockfile";
import { assert, describe, expect, it } from "vitest";

const readOnlyBridge = createReadOnlyBridge();

describe("canUseLockfile", () => {
  it("should return true for filesystem bridge with write capability", () => {
    const fs = createMemoryMockFS();
    expect(canUseLockfile(fs)).toBe(true);
  });

  it("should return false for filesystem bridge without write capability", () => {
    expect(canUseLockfile(readOnlyBridge)).toBe(false);
  });
});

describe("writeLockfile", () => {
  it("should write valid lockfile with correct structure", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
        "15.1.0": {
          path: "15.1.0/.ucd-store.snapshot.json",
          fileCount: 95,
          totalSize: 980000,
        },
      },
    };

    await writeLockfile(fs, lockfilePath, lockfile);

    const written = await fs.read!(lockfilePath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual(lockfile);
  });

  it("should write formatted JSON with indentation", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
      },
    };

    await writeLockfile(fs, lockfilePath, lockfile);

    const written = await fs.read!(lockfilePath);

    expect(() => JSON.parse(written)).not.toThrow();
    expect(written).toContain("\n");
  });

  it("should skip write when filesystem bridge lacks write capability", async () => {
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
      },
    };

    await expect(writeLockfile(readOnlyBridge, lockfilePath, lockfile)).resolves.not.toThrow();
  });

  it("should handle empty versions object", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {},
    };

    await writeLockfile(fs, lockfilePath, lockfile);

    const written = await fs.read!(lockfilePath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual(lockfile);
  });
});

describe("readLockfile", () => {
  it("should read and parse valid lockfile", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
        "15.1.0": {
          path: "15.1.0/.ucd-store.snapshot.json",
          fileCount: 95,
          totalSize: 980000,
        },
      },
      filters: {
        disableDefaultExclusions: false,
        exclude: [],
        include: [],
      },
    };

    await fs.write!(lockfilePath, JSON.stringify(lockfile));

    const result = await readLockfile(fs, lockfilePath);

    expect(result).toEqual(lockfile);
  });

  it("should throw LockfileInvalidError when lockfile is empty", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, "");

    await expect(readLockfile(fs, lockfilePath)).rejects.toThrow(
      LockfileInvalidError,
    );
  });

  it("should include 'lockfile is empty' in error message", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, "");

    const error = await readLockfile(fs, lockfilePath).catch((e) => e);

    expect(error).toBeInstanceOf(LockfileInvalidError);
    expect(error.message).toContain("lockfile is empty");
  });

  it("should throw LockfileInvalidError when JSON is invalid", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, "{ invalid json }");

    await expect(readLockfile(fs, lockfilePath)).rejects.toThrow(
      LockfileInvalidError,
    );
  });

  it("should include 'lockfile is not valid JSON' in error message", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, "{ invalid json }");

    const error = await readLockfile(fs, lockfilePath).catch((e) => e);

    expect(error).toBeInstanceOf(LockfileInvalidError);
    expect(error.message).toContain("lockfile is not valid JSON");
  });

  it("should throw LockfileInvalidError when schema validation fails", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, JSON.stringify({
      lockfileVersion: 2,
      versions: {},
    }));

    const err = await readLockfile(fs, lockfilePath).then((v) => {
      expect.fail("Expected to throw, but resolved with:", v);
    }).catch((e) => e);

    assert.instanceOf(err, LockfileInvalidError);

    expect(err.message).toContain("lockfile does not match expected schema");
  });

  it("should handle lockfile with single version entry", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
      },
      filters: {
        disableDefaultExclusions: false,
        exclude: [],
        include: [],
      },
    };

    await fs.write!(lockfilePath, JSON.stringify(lockfile));

    const result = await readLockfile(fs, lockfilePath);

    expect(result).toEqual(lockfile);
  });

  it("should handle lockfile with multiple version entries", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
        "15.1.0": {
          path: "15.1.0/.ucd-store.snapshot.json",
          fileCount: 95,
          totalSize: 980000,
        },
        "15.0.0": {
          path: "15.0.0/.ucd-store.snapshot.json",
          fileCount: 90,
          totalSize: 950000,
        },
      },
      filters: {
        disableDefaultExclusions: false,
        exclude: [],
        include: [],
      },
    };

    await fs.write!(lockfilePath, JSON.stringify(lockfile));

    const result = await readLockfile(fs, lockfilePath);

    expect(result).toEqual(lockfile);
  });
});

describe("readLockfileOrDefault", () => {
  it("should return lockfile when file exists and is valid", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";
    const lockfile = {
      lockfileVersion: 1 as const,
      versions: {
        "16.0.0": {
          path: "16.0.0/.ucd-store.snapshot.json",
          fileCount: 100,
          totalSize: 1024000,
        },
      },
      filters: {
        disableDefaultExclusions: false,
        exclude: [],
        include: [],
      },
    };

    await fs.write!(lockfilePath, JSON.stringify(lockfile));

    const result = await readLockfileOrDefault(fs, lockfilePath);

    expect(result).toEqual(lockfile);
  });

  it("should return undefined when file does not exist", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    const result = await readLockfileOrDefault(fs, lockfilePath);

    expect(result).toBeUndefined();
  });

  it("should return undefined when file is empty", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, "");

    const result = await readLockfileOrDefault(fs, lockfilePath);

    expect(result).toBeUndefined();
  });

  it("should return undefined when JSON is invalid", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, "{ invalid json }");

    const result = await readLockfileOrDefault(fs, lockfilePath);

    expect(result).toBeUndefined();
  });

  it("should return undefined when schema validation fails", async () => {
    const fs = createMemoryMockFS();
    const lockfilePath = "/test/.ucd-store.lock";

    await fs.write!(lockfilePath, JSON.stringify({
      lockfileVersion: 2,
      versions: {},
    }));

    const result = await readLockfileOrDefault(fs, lockfilePath);

    expect(result).toBeUndefined();
  });
});

describe("getLockfilePath", () => {
  it("should return relative path with .ucd-store.lock filename", () => {
    const basePath = "/test/store";
    const result = getLockfilePath(basePath);

    // getLockfilePath returns a relative path; callers handle the basePath
    expect(result).toBe(".ucd-store.lock");
  });

  it("should return same relative path regardless of base path", () => {
    const basePath = "/deep/nested/path/to/store";
    const result = getLockfilePath(basePath);

    // The basePath parameter is unused; function always returns relative path
    expect(result).toBe(".ucd-store.lock");
  });
});
