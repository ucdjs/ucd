import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { describe, expect, it } from "vitest";
import { LockfileInvalidError } from "../src/errors";
import { parseSnapshot, parseSnapshotOrUndefined, readSnapshot, readSnapshotOrUndefined, writeSnapshot } from "../src/snapshot";

describe("readSnapshot", () => {
  const validSnapshot = {
    unicodeVersion: "16.0.0",
    files: {
      "UnicodeData.txt": {
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        fileHash: "sha256:a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 1024,
      },
      "Blocks.txt": {
        hash: "sha256:b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        fileHash: "sha256:c3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 2048,
      },
    },
  };

  it("should read and parse a valid snapshot", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": JSON.stringify(validSnapshot),
      },
    });

    const snapshot = await readSnapshot(fs, "16.0.0");

    expect(snapshot.unicodeVersion).toBe("16.0.0");
    expect(Object.keys(snapshot.files)).toHaveLength(2);
    expect(snapshot.files["UnicodeData.txt"]?.size).toBe(1024);
    expect(snapshot.files["Blocks.txt"]?.size).toBe(2048);
  });

  it("should throw LockfileInvalidError when snapshot is empty", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": "",
      },
    });

    // TODO: make use of the toMatchError here.
    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow(LockfileInvalidError);
    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow("snapshot is empty");
  });

  it("should throw LockfileInvalidError when snapshot is not valid JSON", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": "not valid json {",
      },
    });

    // TODO: make use of the toMatchError here.
    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow(LockfileInvalidError);
    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow("snapshot is not valid JSON");
  });

  it("should throw LockfileInvalidError when snapshot does not match schema", async () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          // Missing hash and fileHash
          size: 1024,
        },
      },
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": JSON.stringify(invalidSnapshot),
      },
    });

    // TODO: make use of the toMatchError here.
    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow(LockfileInvalidError);
    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow("snapshot does not match expected schema");
  });

  it("should throw LockfileInvalidError when snapshot does not exist", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow(LockfileInvalidError);
  });

  it("should validate hash format", async () => {
    const invalidHashSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "invalid-hash",
          fileHash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          size: 1024,
        },
      },
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": JSON.stringify(invalidHashSnapshot),
      },
    });

    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow(LockfileInvalidError);
  });

  it("should reject negative file sizes", async () => {
    const invalidSizeSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          fileHash: "sha256:a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          size: -100,
        },
      },
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": JSON.stringify(invalidSizeSnapshot),
      },
    });

    await expect(readSnapshot(fs, "16.0.0")).rejects.toThrow(LockfileInvalidError);
  });
});

describe("writeSnapshot", () => {
  const validSnapshot = {
    unicodeVersion: "16.0.0",
    files: {
      "UnicodeData.txt": {
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        fileHash: "sha256:a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 1024,
      },
    },
  };

  it("should write a snapshot to the filesystem", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/": "", // Create version directory
      },
    });

    await writeSnapshot(fs, "16.0.0", validSnapshot);

    const content = await fs.read("16.0.0/snapshot.json");
    expect(content).toBeDefined();

    const parsed = JSON.parse(content!);
    expect(parsed.unicodeVersion).toBe("16.0.0");
    expect(parsed.files["UnicodeData.txt"].size).toBe(1024);
  });

  it("should write snapshot with pretty formatting", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/": "",
      },
    });

    await writeSnapshot(fs, "16.0.0", validSnapshot);

    const content = await fs.read("16.0.0/snapshot.json");
    expect(content).toContain("\n");
    expect(content).toContain("  ");
  });

  it("should create version directory if it doesn't exist", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    await writeSnapshot(fs, "16.0.0", validSnapshot);

    const content = await fs.read("16.0.0/snapshot.json");
    expect(content).toBeDefined();
  });

  it("should skip writing when filesystem does not support write operations", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
      functions: {
        write: false,
      },
    });

    // Should not throw, just skip
    await expect(writeSnapshot(fs, "16.0.0", validSnapshot)).resolves.toBeUndefined();
  });

  it("should skip writing when mkdir is not available", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
      functions: {
        mkdir: false,
      },
    });

    await expect(writeSnapshot(fs, "16.0.0", validSnapshot)).resolves.toBeUndefined();
    await expect(fs.exists("16.0.0/snapshot.json")).resolves.toBe(false);
  });
});

describe("readSnapshotOrUndefined", () => {
  const validSnapshot = {
    unicodeVersion: "16.0.0",
    files: {},
  };

  it("should read a valid snapshot", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": JSON.stringify(validSnapshot),
      },
    });

    const snapshot = await readSnapshotOrUndefined(fs, "16.0.0");

    expect(snapshot).toBeDefined();
    expect(snapshot?.unicodeVersion).toBe("16.0.0");
  });

  it("should return undefined when snapshot does not exist", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {},
    });

    const snapshot = await readSnapshotOrUndefined(fs, "16.0.0");

    expect(snapshot).toBeUndefined();
  });

  it("should return undefined when snapshot is invalid", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": "not valid json",
      },
    });

    const snapshot = await readSnapshotOrUndefined(fs, "16.0.0");

    expect(snapshot).toBeUndefined();
  });

  it("should return undefined when snapshot does not match schema", async () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      // Missing files field
    };

    const fs = createMemoryMockFS({
      initialFiles: {
        "16.0.0/snapshot.json": JSON.stringify(invalidSnapshot),
      },
    });

    const snapshot = await readSnapshotOrUndefined(fs, "16.0.0");

    expect(snapshot).toBeUndefined();
  });
});

describe("parseSnapshot", () => {
  const validSnapshot = {
    unicodeVersion: "16.0.0",
    files: {
      "UnicodeData.txt": {
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        fileHash: "sha256:a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 1024,
      },
    },
  };

  it("should parse and validate a valid snapshot string", () => {
    const snapshot = parseSnapshot(JSON.stringify(validSnapshot));

    expect(snapshot.unicodeVersion).toBe("16.0.0");
    expect(Object.keys(snapshot.files)).toHaveLength(1);
    expect(snapshot.files["UnicodeData.txt"]?.size).toBe(1024);
  });

  it("should throw LockfileInvalidError when content is empty", () => {
    expect(() => parseSnapshot("")).toThrow(LockfileInvalidError);
    expect(() => parseSnapshot("")).toThrow("snapshot is empty");
  });

  it("should throw LockfileInvalidError when content is not valid JSON", () => {
    expect(() => parseSnapshot("not valid json {")).toThrow(LockfileInvalidError);
    expect(() => parseSnapshot("not valid json {")).toThrow("snapshot is not valid JSON");
  });

  it("should throw LockfileInvalidError when content does not match schema", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          // Missing hash and fileHash
          size: 1024,
        },
      },
    };

    expect(() => parseSnapshot(JSON.stringify(invalidSnapshot))).toThrow(LockfileInvalidError);
    expect(() => parseSnapshot(JSON.stringify(invalidSnapshot))).toThrow("snapshot does not match expected schema");
  });
});

describe("parseSnapshotOrUndefined", () => {
  const validSnapshot = {
    unicodeVersion: "16.0.0",
    files: {},
  };

  it("should parse a valid snapshot string", () => {
    const snapshot = parseSnapshotOrUndefined(JSON.stringify(validSnapshot));

    expect(snapshot).toBeDefined();
    expect(snapshot?.unicodeVersion).toBe("16.0.0");
  });

  it("should return undefined when content is empty", () => {
    expect(parseSnapshotOrUndefined("")).toBeUndefined();
  });

  it("should return undefined when content is invalid JSON", () => {
    expect(parseSnapshotOrUndefined("not valid json")).toBeUndefined();
  });

  it("should return undefined when content does not match schema", () => {
    const invalidSnapshot = {
      unicodeVersion: "16.0.0",
      // Missing files field
    };

    expect(parseSnapshotOrUndefined(JSON.stringify(invalidSnapshot))).toBeUndefined();
  });
});
