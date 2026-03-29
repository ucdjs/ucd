import { describe, expect, it } from "vitest";
import {
  computeUnicodeBytesHash,
  computeUnicodeTextHash,
  computeUnicodeTextHashWithoutHeader,
  getUnicodeBytesSize,
  getUnicodeTextSize,
} from "../src/unicode-hash";

describe("unicode-hash", () => {
  it("should compute the same hash for equivalent text and bytes", async () => {
    const content = "# Date: 2024-01-01\n0041;LATIN CAPITAL LETTER A\n";
    const bytes = new TextEncoder().encode(content);

    await expect(computeUnicodeBytesHash(bytes)).resolves.toBe(
      await computeUnicodeTextHash(content),
    );
  });

  it("should keep semantic hashes stable when only the Unicode header changes", async () => {
    const first = [
      "# UnicodeData-16.0.0.txt",
      "# Date: 2024-01-01",
      "# © 2024 Unicode®, Inc.",
      "",
      "0041;LATIN CAPITAL LETTER A",
    ].join("\n");
    const second = [
      "# UnicodeData-17.0.0.txt",
      "# Date: 2025-01-01",
      "# © 2025 Unicode®, Inc.",
      "",
      "0041;LATIN CAPITAL LETTER A",
    ].join("\n");

    await expect(computeUnicodeTextHashWithoutHeader(first)).resolves.toBe(
      await computeUnicodeTextHashWithoutHeader(second),
    );
    await expect(computeUnicodeTextHash(first)).resolves.not.toBe(
      await computeUnicodeTextHash(second),
    );
  });

  it("should compute byte sizes for binary data without decoding", () => {
    const bytes = Uint8Array.from([0, 255, 16, 32, 64]);

    expect(getUnicodeBytesSize(bytes)).toBe(5);
    expect(getUnicodeTextSize("hello")).toBe(5);
  });
});
