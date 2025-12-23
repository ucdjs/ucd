import { createMemoryMockFS, createReadOnlyBridge } from "#test-utils/fs-bridges";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import {
  computeFileHash,
  getSnapshotPath,
  LockfileBridgeUnsupportedOperation,
  LockfileInvalidError,
  readSnapshot,
  readSnapshotOrDefault,
  writeSnapshot,
} from "@ucdjs/lockfile";
import { createSnapshot } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it, vi } from "vitest";

const readOnlyBridge = createReadOnlyBridge();

describe("getSnapshotPath", () => {
  it("should return relative path format", () => {
    const version = "16.0.0";
    const result = getSnapshotPath(version);

    expect(result).toBe("16.0.0/snapshot.json");
  });

  it("should return relative path regardless of basePath", () => {
    const version = "15.1.0";
    const result = getSnapshotPath(version);

    expect(result).toBe("15.1.0/snapshot.json");
  });

  it("should handle different version formats", () => {
    expect(getSnapshotPath("16.0.0")).toBe("16.0.0/snapshot.json");
    expect(getSnapshotPath("15.1.0")).toBe("15.1.0/snapshot.json");
    expect(getSnapshotPath("1.0.0")).toBe("1.0.0/snapshot.json");
  });
});

describe("computeFileHash", () => {
  it("should compute correct SHA-256 hash for string content", async () => {
    const content = "test content";
    const hash = await computeFileHash(content);

    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    // Verify it's deterministic
    const hash2 = await computeFileHash(content);
    expect(hash).toBe(hash2);
  });

  it("should compute correct SHA-256 hash for Uint8Array content", async () => {
    const content = new TextEncoder().encode("test content");
    const hash = await computeFileHash(content);

    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    // Should match string version
    const stringHash = await computeFileHash("test content");
    expect(hash).toBe(stringHash);
  });

  it("should return hash in sha256: format", async () => {
    const hash = await computeFileHash("test");
    expect(hash).toMatch(/^sha256:/);
    expect(hash.length).toBe(71); // "sha256:" + 64 hex chars
  });

  it("should produce different hashes for different content", async () => {
    const hash1 = await computeFileHash("content1");
    const hash2 = await computeFileHash("content2");

    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty string", async () => {
    const hash = await computeFileHash("");
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("should handle unicode content", async () => {
    const content = "测试内容 🎉";
    const hash = await computeFileHash(content);
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe("readSnapshot", () => {
  it("should read and parse valid snapshot", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content1",
      "Blocks.txt": "content2",
    });

    const snapshotPath = getSnapshotPath(version);
    await fs.write!(snapshotPath, JSON.stringify(snapshot));

    const result = await readSnapshot(fs, basePath, version);

    expect(result).toEqual(snapshot);
    expect(result.unicodeVersion).toBe("16.0.0");
    expect(Object.keys(result.files).length).toBe(2);
    expect(result.files["UnicodeData.txt"]).toBeDefined();
    expect(result.files["Blocks.txt"]).toBeDefined();
  });

  it("should throw LockfileInvalidError when snapshot is empty", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, "");

    await expect(readSnapshot(fs, basePath, version)).rejects.toThrow(
      LockfileInvalidError,
    );
  });

  it("should include 'snapshot is empty' in error message", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, "");

    const error = await readSnapshot(fs, basePath, version).catch((e) => e);

    expect(error).toBeInstanceOf(LockfileInvalidError);
    expect(error.message).toContain("snapshot is empty");
  });

  it("should throw LockfileInvalidError when JSON is invalid", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, "{ invalid json }");

    await expect(readSnapshot(fs, basePath, version)).rejects.toThrow(
      LockfileInvalidError,
    );
  });

  it("should include 'snapshot is not valid JSON' in error message", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, "{ invalid json }");

    const error = await readSnapshot(fs, basePath, version).catch((e) => e);

    expect(error).toBeInstanceOf(LockfileInvalidError);
    expect(error.message).toContain("snapshot is not valid JSON");
  });

  it("should throw LockfileInvalidError when schema validation fails", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, JSON.stringify({
      unicodeVersion: "16.0.0",
      // Missing files field
    }));

    const err = await readSnapshot(fs, basePath, version).then((v) => {
      expect.fail("Expected to throw, but resolved with:", v);
    }).catch((e) => e);

    expect(err).toBeInstanceOf(LockfileInvalidError);
    expect(err.message).toContain("snapshot does not match expected schema");
  });

  it("should handle snapshot with single file entry", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    const snapshotPath = getSnapshotPath(version);
    await fs.write!(snapshotPath, JSON.stringify(snapshot));

    const result = await readSnapshot(fs, basePath, version);

    expect(result.unicodeVersion).toBe("16.0.0");
    expect(Object.keys(result.files).length).toBe(1);
    const fileEntry = result.files["UnicodeData.txt"];
    expect(fileEntry).toBeDefined();
    expect(fileEntry?.hash).toMatch(/^sha256:/);
  });

  it("should handle snapshot with multiple file entries", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content1",
      "Blocks.txt": "content2",
      "extracted/DerivedBidiClass.txt": "content3",
    });

    const snapshotPath = getSnapshotPath(version);
    await fs.write!(snapshotPath, JSON.stringify(snapshot));

    const result = await readSnapshot(fs, basePath, version);

    expect(result.unicodeVersion).toBe("16.0.0");
    expect(Object.keys(result.files).length).toBe(3);
    expect(result.files["UnicodeData.txt"]).toBeDefined();
    expect(result.files["Blocks.txt"]).toBeDefined();
    expect(result.files["extracted/DerivedBidiClass.txt"]).toBeDefined();
  });
});

describe("writeSnapshot", () => {
  it("should write valid snapshot with correct structure", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content1",
      "Blocks.txt": "content2",
    });

    await writeSnapshot(fs, basePath, version, snapshot);

    const snapshotPath = getSnapshotPath(version);
    const written = await fs.read!(snapshotPath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual(snapshot);
  });

  it("should create snapshot directory if it doesn't exist", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    const snapshotDir = `/test/${version}`;
    const dirExistsBefore = await fs.exists(snapshotDir);
    expect(dirExistsBefore).toBe(false);

    await writeSnapshot(fs, basePath, version, snapshot);

    const dirExistsAfter = await fs.exists(snapshotDir);
    expect(dirExistsAfter).toBe(true);
  });

  it("should write formatted JSON with indentation", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    await writeSnapshot(fs, basePath, version, snapshot);

    const snapshotPath = getSnapshotPath(version);
    const written = await fs.read!(snapshotPath);

    expect(() => JSON.parse(written)).not.toThrow();
    expect(written).toContain("\n");
  });

  it("should skip write when filesystem bridge lacks write capability", async () => {
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    await expect(writeSnapshot(readOnlyBridge, basePath, version, snapshot)).resolves.not.toThrow();
  });

  it("should throw LockfileBridgeUnsupportedOperation when directory doesn't exist and mkdir unavailable", async () => {
    const bridgeWithoutMkdir = defineFileSystemBridge({
      meta: { name: "No-Mkdir", description: "Bridge without mkdir" },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(false),
        listdir: vi.fn().mockResolvedValue([]),
        optionalCapabilities: {
          mkdir: false,
        },
      }),
    })();

    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    await expect(writeSnapshot(bridgeWithoutMkdir, basePath, version, snapshot)).rejects.toThrow(
      LockfileBridgeUnsupportedOperation,
    );
  });

  it("should not create directory when it already exists", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    const snapshotDir = `/test/${version}`;
    await fs.mkdir!(snapshotDir);

    // Should not throw
    await expect(writeSnapshot(fs, basePath, version, snapshot)).resolves.not.toThrow();
  });
});

describe("readSnapshotOrDefault", () => {
  it("should return snapshot when file exists and is valid", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshot = await createSnapshot(version, {
      "UnicodeData.txt": "content",
    });

    const snapshotPath = getSnapshotPath(version);
    await fs.write!(snapshotPath, JSON.stringify(snapshot));

    const result = await readSnapshotOrDefault(fs, basePath, version);

    expect(result).toEqual(snapshot);
  });

  it("should return undefined when file does not exist", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";

    const result = await readSnapshotOrDefault(fs, basePath, version);

    expect(result).toBeUndefined();
  });

  it("should return undefined when file is empty", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, "");

    const result = await readSnapshotOrDefault(fs, basePath, version);

    expect(result).toBeUndefined();
  });

  it("should return undefined when JSON is invalid", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, "{ invalid json }");

    const result = await readSnapshotOrDefault(fs, basePath, version);

    expect(result).toBeUndefined();
  });

  it("should return undefined when schema validation fails", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const version = "16.0.0";
    const snapshotPath = getSnapshotPath(version);

    await fs.write!(snapshotPath, JSON.stringify({
      unicodeVersion: "16.0.0",
      // Missing files field
    }));

    const result = await readSnapshotOrDefault(fs, basePath, version);

    expect(result).toBeUndefined();
  });
});
