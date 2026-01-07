import { describe, expect, it } from "vitest";
import {
  createEmptySnapshot,
  createSnapshot,
  createSnapshotWithHashes,
} from "../src/test-utils/snapshot-builder";

describe("snapshot-builder", () => {
  describe("createSnapshot", () => {
    it("should create a snapshot with auto-computed hashes", async () => {
      const snapshot = await createSnapshot("16.0.0", {
        "UnicodeData.txt": "# Test file content\n0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;",
        "Blocks.txt": "# Blocks\n0000..007F; Basic Latin",
      });

      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(Object.keys(snapshot.files)).toHaveLength(2);
      expect(snapshot.files["UnicodeData.txt"]).toBeDefined();
      expect(snapshot.files["Blocks.txt"]).toBeDefined();

      // Hashes should be in the correct format
      expect(snapshot.files["UnicodeData.txt"]?.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(snapshot.files["UnicodeData.txt"]?.fileHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it("should compute sizes correctly", async () => {
      const content = "Hello, World!";
      const snapshot = await createSnapshot("16.0.0", {
        "test.txt": content,
      });

      expect(snapshot.files["test.txt"]?.size).toBe(new TextEncoder().encode(content).length);
    });

    it("should use pre-computed hashes when provided", async () => {
      const customHash = "sha256:0000000000000000000000000000000000000000000000000000000000000001";
      const customFileHash = "sha256:0000000000000000000000000000000000000000000000000000000000000002";

      const snapshot = await createSnapshot("16.0.0", {
        "test.txt": "content",
      }, {
        hashes: { "test.txt": customHash },
        fileHashes: { "test.txt": customFileHash },
      });

      expect(snapshot.files["test.txt"]?.hash).toBe(customHash);
      expect(snapshot.files["test.txt"]?.fileHash).toBe(customFileHash);
    });

    it("should use pre-computed sizes when provided", async () => {
      const snapshot = await createSnapshot("16.0.0", {
        "test.txt": "short",
      }, {
        sizes: { "test.txt": 99999 },
      });

      expect(snapshot.files["test.txt"]?.size).toBe(99999);
    });

    it("should handle empty files map", async () => {
      const snapshot = await createSnapshot("16.0.0", {});

      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(Object.keys(snapshot.files)).toHaveLength(0);
    });

    it("should compute different hashes for hash vs fileHash when content has Unicode header", async () => {
      // Content with Unicode header - hash should strip header, fileHash should not
      const contentWithHeader = `# UnicodeData-16.0.0.txt
# Date: 2024-01-01, 00:00:00 GMT
# © 2024 Unicode®, Inc.

0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;`;

      const snapshot = await createSnapshot("16.0.0", {
        "UnicodeData.txt": contentWithHeader,
      });

      // hash and fileHash should be different since header is stripped for hash
      expect(snapshot.files["UnicodeData.txt"]?.hash).not.toBe(
        snapshot.files["UnicodeData.txt"]?.fileHash,
      );
    });
  });

  describe("createSnapshotWithHashes", () => {
    it("should create a snapshot with exact values", () => {
      const hash = "sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
      const fileHash = "sha256:9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba";

      const snapshot = createSnapshotWithHashes("15.1.0", {
        "file1.txt": { hash, fileHash, size: 1000 },
        "file2.txt": { hash, fileHash, size: 2000 },
      });

      expect(snapshot.unicodeVersion).toBe("15.1.0");
      expect(snapshot.files["file1.txt"]?.hash).toBe(hash);
      expect(snapshot.files["file1.txt"]?.fileHash).toBe(fileHash);
      expect(snapshot.files["file1.txt"]?.size).toBe(1000);
      expect(snapshot.files["file2.txt"]?.size).toBe(2000);
    });

    it("should handle empty files", () => {
      const snapshot = createSnapshotWithHashes("16.0.0", {});

      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(Object.keys(snapshot.files)).toHaveLength(0);
    });
  });

  describe("createEmptySnapshot", () => {
    it("should create an empty snapshot", () => {
      const snapshot = createEmptySnapshot("16.0.0");

      expect(snapshot.unicodeVersion).toBe("16.0.0");
      expect(snapshot.files).toEqual({});
    });
  });
});
