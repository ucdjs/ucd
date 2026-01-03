import { dedent } from "@luxass/utils";
import { describe, expect, it } from "vitest";
import {
  computeFileHash,
  computeFileHashWithoutUCDHeader,
  stripUnicodeHeader,
} from "../src/hash";

describe("hash utilities", () => {
  describe("stripUnicodeHeader", () => {
    it("should strip Unicode header with version, date, and copyright", () => {
      const content = dedent`
        # DerivedBinaryProperties-16.0.0.txt
        # Date: 2024-01-01, 00:00:00 GMT
        # © 2024 Unicode®, Inc.

        # Actual content starts here
        0041..005A    ; Alphabetic
      `;

      const stripped = stripUnicodeHeader(content);

      expect(stripped).toBe(dedent`
        # Actual content starts here
        0041..005A    ; Alphabetic
      `);
    });

    it("should strip header with only filename", () => {
      const content = dedent`
        # UnicodeData-15.1.0.txt

        0041;LATIN CAPITAL LETTER A
      `;

      const stripped = stripUnicodeHeader(content);

      expect(stripped).toBe("0041;LATIN CAPITAL LETTER A");
    });

    it("should strip header with only date", () => {
      const content = dedent`
        # Date: 2024-01-01, 00:00:00 GMT

        Data here
      `;

      const stripped = stripUnicodeHeader(content);

      expect(stripped).toBe("Data here");
    });

    it("should strip header with copyright variations", () => {
      const contentWithCircleC = dedent`
        # © 2024 Unicode®, Inc.

        Data
      `;
      expect(stripUnicodeHeader(contentWithCircleC)).toBe("Data");

      const contentWithUnicodeInc = dedent`
        # Unicode, Inc. 2024

        Data
      `;
      expect(stripUnicodeHeader(contentWithUnicodeInc)).toBe("Data");
    });

    it("should preserve content without header", () => {
      const content = dedent`
        # This is a comment
        # Another comment
        0041;LATIN CAPITAL LETTER A
      `;

      const stripped = stripUnicodeHeader(content);

      // No header lines detected, content should be unchanged
      expect(stripped).toBe(content);
    });

    it("should handle empty content", () => {
      expect(stripUnicodeHeader("")).toBe("");
    });

    it("should handle content with only header", () => {
      const content = dedent`
        # UnicodeData-16.0.0.txt
        # Date: 2024-01-01, 00:00:00 GMT
        # © 2024 Unicode®, Inc.
      `;

      const stripped = stripUnicodeHeader(content);

      // After stripping header, nothing remains
      expect(stripped).toBe("");
    });

    it("should skip blank lines after header", () => {
      const content = dedent`
        # UnicodeData-16.0.0.txt



        Data starts here
      `;

      const stripped = stripUnicodeHeader(content);

      expect(stripped).toBe("Data starts here");
    });
  });

  describe("computeFileHash", () => {
    it("should compute SHA-256 hash of string content", async () => {
      const hash = await computeFileHash("Hello, World!");

      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it("should compute SHA-256 hash of Uint8Array content", async () => {
      const content = new TextEncoder().encode("Hello, World!");
      const hash = await computeFileHash(content);

      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it("should produce consistent hashes for the same content", async () => {
      const content = "Test content for hashing";

      const hash1 = await computeFileHash(content);
      const hash2 = await computeFileHash(content);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different content", async () => {
      const hash1 = await computeFileHash("Content A");
      const hash2 = await computeFileHash("Content B");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", async () => {
      const hash = await computeFileHash("");

      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      // SHA-256 of empty string is a known value
      expect(hash).toBe("sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });

    it("should handle Unicode content", async () => {
      const hash = await computeFileHash("Hello, 世界! 🌍");

      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  describe("computeFileHashWithoutUCDHeader", () => {
    it("should strip header before hashing", async () => {
      const contentWithHeader = dedent`
        # UnicodeData-16.0.0.txt
        # Date: 2024-01-01, 00:00:00 GMT

        Actual data
      `;

      const contentWithoutHeader = "Actual data";

      const hashWithHeader = await computeFileHashWithoutUCDHeader(contentWithHeader);
      const hashWithoutHeader = await computeFileHashWithoutUCDHeader(contentWithoutHeader);

      // Both should produce the same hash since header is stripped
      expect(hashWithHeader).toBe(hashWithoutHeader);
    });

    it("should produce different hash than computeFileHash for content with header", async () => {
      const content = dedent`
        # UnicodeData-16.0.0.txt
        # Date: 2024-01-01, 00:00:00 GMT

        Data here
      `;

      const contentHash = await computeFileHashWithoutUCDHeader(content);
      const fileHash = await computeFileHash(content);

      // contentHash strips header, fileHash doesn't
      expect(contentHash).not.toBe(fileHash);
    });

    it("should produce same hash as computeFileHash for content without header", async () => {
      const content = "Just some regular content without Unicode header";

      const contentHash = await computeFileHashWithoutUCDHeader(content);
      const fileHash = await computeFileHash(content);

      // No header to strip, both should be the same
      expect(contentHash).toBe(fileHash);
    });
  });
});
