// TODO: A lot of this will be replaced with a proper unicode library later
// @unicode-utils/core

/**
 * Combined regex pattern for Unicode header lines:
 * - Filename with version (e.g., "DerivedBinaryProperties-15.1.0.txt")
 * - Date line (e.g., "Date: 2023-01-05")
 * - Copyright line (e.g., "© 2023 Unicode®, Inc.")
 */
const HEADER_LINE_PATTERN = /\d+\.\d+\.\d+\.txt|Date:|©|Unicode®|Unicode,\s*Inc/i;

/**
 * Strips the Unicode file header from content.
 * The header typically contains:
 * - Filename with version (e.g., "# DerivedBinaryProperties-15.1.0.txt")
 * - Date line (e.g., "# Date: 2023-01-05, 20:34:33 GMT")
 * - Copyright line (e.g., "# © 2023 Unicode®, Inc.")
 *
 * @param {string} content - The file content to strip the header from
 * @returns {string} The content with the header stripped
 */
export function stripUnicodeHeader(content: string): string {
  // Match consecutive comment lines at the start that look like header lines
  const lines = content.split("\n");
  let headerEndIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line == null) {
      continue;
    }

    const trimmedLine = line.trim();

    // Empty lines within the header block are allowed
    if (trimmedLine === "" || trimmedLine === "#") {
      continue;
    }

    // Check if this is a header line (comment starting with # that matches header pattern)
    if (trimmedLine.startsWith("#") && HEADER_LINE_PATTERN.test(trimmedLine)) {
      headerEndIndex = i + 1;
      continue;
    }

    // Once we hit a non-header line, stop
    break;
  }

  // If we found header lines, skip them
  if (headerEndIndex > 0) {
    // Also skip any blank lines immediately after the header
    while (headerEndIndex < lines.length && lines[headerEndIndex]?.trim() === "") {
      headerEndIndex++;
    }
    return lines.slice(headerEndIndex).join("\n");
  }

  return content;
}

/**
 * Cached TextEncoder instance for UTF-8 string encoding.
 *
 * @internal
 */
const textEncoder = new TextEncoder();

/**
 * Hex characters for nibble-to-hex conversion.
 *
 * @internal
 */
const HEX_CHARS = "0123456789abcdef";

/**
 * Pre-computed lookup table for byte-to-hex conversion.
 * Maps each byte value (0-255) to its two-character hex representation.
 * Uses bit operations to extract high and low nibbles.
 *
 * @internal
 */
const HEX_TABLE: string[] = [];
for (let i = 0; i < 256; i++) {
  HEX_TABLE[i] = HEX_CHARS[i >> 4]! + HEX_CHARS[i & 0xF]!;
}

/**
 * Converts a Uint8Array to a hex string using pre-computed lookup table.
 *
 * @internal
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += HEX_TABLE[bytes[i]!];
  }
  return result;
}

/**
 * Computes the SHA-256 hash of file content using Web Crypto API.
 * Works in both browser and Node.js 18+ environments.
 *
 * @param {string | Uint8Array} content - The file content to hash
 * @returns {Promise<string>} A promise that resolves to the hash in format "sha256:..."
 * @throws {Error} When Web Crypto API is not available
 */
export async function computeFileHash(content: string | Uint8Array): Promise<string> {
  // Convert string to Uint8Array if needed
  const data = typeof content === "string" ? textEncoder.encode(content) : content;

  // Use Web Crypto API (available in browsers and Node.js 18+)
  // crypto.subtle.digest accepts Uint8Array directly - no buffer extraction needed
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
    return `sha256:${uint8ArrayToHex(new Uint8Array(hashBuffer))}`;
  }

  throw new Error(
    "SHA-256 hashing is not available. Web Crypto API is required for hash computation.",
  );
}

/**
 * Computes the SHA-256 hash of file content after stripping the Unicode header.
 * This is useful for comparing file content across versions, since the header
 * contains version-specific information (version number, date, copyright year).
 *
 * @param {string} content - The file content to hash
 * @returns {Promise<string>} A promise that resolves to the hash in format "sha256:..."
 * @throws {Error} When Web Crypto API is not available
 */
export async function computeFileHashWithoutUCDHeader(content: string): Promise<string> {
  const strippedContent = stripUnicodeHeader(content);
  return computeFileHash(strippedContent);
}
