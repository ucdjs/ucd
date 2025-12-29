// TODO: A lot of this will be replaced with a proper unicode library later
// @unicode-utils/core

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

    // Check if this is a header line
    if (trimmedLine.startsWith("#")) {
      const isHeaderLine
        = /\d+\.\d+\.\d+\.txt/i.test(trimmedLine) // Filename with version
          || /Date:/i.test(trimmedLine) // Date line
          || /©|Unicode®|Unicode,\s*Inc/i.test(trimmedLine); // Copyright line

      if (isHeaderLine) {
        headerEndIndex = i + 1;
        continue;
      }
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
 * Converts a string to Uint8Array using UTF-8 encoding.
 * Provides a fallback for environments without TextEncoder.
 *
 * @internal
 */
function stringToUint8Array(str: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str);
  }

  // Fallback for environments without TextEncoder: manual UTF-8 encoding
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i);
    if (codePoint === undefined) {
      continue;
    }
    // If this is a surrogate pair, advance an extra code unit
    if (codePoint > 0xFFFF) {
      i++;
    }
    if (codePoint <= 0x7F) {
      // 1-byte sequence
      bytes.push(codePoint);
    } else if (codePoint <= 0x7FF) {
      // 2-byte sequence
      bytes.push(
        0xC0 | (codePoint >> 6),
        0x80 | (codePoint & 0x3F),
      );
    } else if (codePoint <= 0xFFFF) {
      // 3-byte sequence
      bytes.push(
        0xE0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3F),
        0x80 | (codePoint & 0x3F),
      );
    } else {
      // 4-byte sequence
      bytes.push(
        0xF0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3F),
        0x80 | ((codePoint >> 6) & 0x3F),
        0x80 | (codePoint & 0x3F),
      );
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Converts a Uint8Array to a hex string.
 *
 * @internal
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Computes the SHA-256 hash of file content using Web Crypto API.
 * This is a basic implementation that works in both browser and Node.js environments.
 *
 * @param {string | Uint8Array} content - The file content to hash
 * @returns {Promise<string>} A promise that resolves to the hash in format "sha256:..."
 * @throws {Error} When Web Crypto API is not available
 */
export async function computeFileHash(content: string | Uint8Array): Promise<string> {
  // Convert string to Uint8Array if needed
  const data = typeof content === "string" ? stringToUint8Array(content) : content;

  // Ensure we have a proper ArrayBufferView for crypto.subtle.digest
  const buffer = data.buffer instanceof ArrayBuffer
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : new Uint8Array(data).buffer;

  // Use Web Crypto API (available in browsers and Node.js 18+)
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = uint8ArrayToHex(hashArray);
    return `sha256:${hashHex}`;
  }

  // Fallback: This should not happen in modern environments, but provide a basic implementation
  // Note: This is a placeholder that can be replaced with a proper crypto library later
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
export async function computeContentHash(content: string): Promise<string> {
  const strippedContent = stripUnicodeHeader(content);
  return computeFileHash(strippedContent);
}
