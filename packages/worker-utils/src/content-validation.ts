import { MAX_SHIKI_SIZE } from "./constants";

/**
 * Text-based content types that support syntax highlighting
 */
export const SHIKI_SUPPORTED_TYPES = [
  "text/plain",
  "text/csv",
  "text/tab-separated-values",
  "application/octet-stream", // UCD files often return this
  "application/json",
  "application/xml",
  "text/xml",
];

/**
 * File extensions that can be syntax highlighted
 */
export const SHIKI_SUPPORTED_EXTENSIONS = [
  "txt",
  "csv",
  "tsv",
  "xml",
  "json",
  "md",
];

/**
 * Result type for eligibility check
 */
export interface ShikiEligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Check if a file is eligible for syntax highlighting
 *
 * @param contentType - The HTTP Content-Type header value
 * @param extension - The file extension (without dot)
 * @param size - The file size in bytes
 * @returns Object with eligibility status and optional reason
 *
 * @example
 * ```typescript
 * const result = isShikiEligible("text/plain", "txt", 1024);
 * if (result.eligible) {
 *   // Proceed with highlighting
 * }
 * ```
 */
export function isShikiEligible(
  contentType: string,
  extension: string,
  size: number,
): ShikiEligibilityResult {
  // Check size limit first
  if (size > MAX_SHIKI_SIZE) {
    return {
      eligible: false,
      reason: `File too large (${(size / 1024).toFixed(1)}KB > ${MAX_SHIKI_SIZE / 1024}KB limit)`,
    };
  }

  // Check extension
  const ext = extension.toLowerCase();
  if (!SHIKI_SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      eligible: false,
      reason: `Unsupported file extension: ${ext}`,
    };
  }

  // Check content type is text-based
  const isText = SHIKI_SUPPORTED_TYPES.some((type) =>
    contentType.toLowerCase().includes(type.toLowerCase()),
  );

  if (!isText) {
    return {
      eligible: false,
      reason: `Non-text content type: ${contentType}`,
    };
  }

  return { eligible: true };
}

/**
 * Detect the appropriate language/grammar for a UCD file path
 *
 * This maps UCD file paths to their specific grammars for better
 * syntax highlighting of Unicode data files.
 *
 * @param path - The file path (e.g., "15.1.0/ucd/UnicodeData.txt")
 * @returns The language identifier for syntax highlighting
 *
 * @example
 * ```typescript
 * const lang = detectUCDLanguage("15.1.0/ucd/UnicodeData.txt");
 * // Returns: "ucd-unicodedata"
 * ```
 */
export function detectUCDLanguage(path: string): string {
  const filename = path.toLowerCase();

  // UCD-specific file detection
  if (filename.includes("arabicshaping")) return "ucd-arabic-shaping";
  if (filename.includes("unicodedata")) return "ucd-unicodedata";
  if (filename.includes("blocks")) return "ucd-blocks";
  if (filename.includes("scripts")) return "ucd-scripts";
  if (filename.includes("propertyvaluealiases")) return "ucd-properties";
  if (filename.includes("characterranges") || filename.includes("ranges")) return "ucd-ranges";
  if (filename.includes("emoji-data")) return "ucd-emoji";
  if (filename.includes("emoji-sequences")) return "ucd-emoji-sequences";
  if (filename.includes("emoji-zwj-sequences")) return "ucd-emoji-zwj";
  if (filename.includes("namedsequences")) return "ucd-named-sequences";
  if (filename.includes("normalization")) return "ucd-normalization";
  if (filename.includes("confusables")) return "ucd-confusables";
  if (filename.includes("casefolding")) return "ucd-casefolding";
  if (filename.includes("bidi") || filename.includes("bidibrackets")) return "ucd-bidi";
  if (filename.includes("grapheme") || filename.includes("graphemebreak")) return "ucd-grapheme";
  if (filename.includes("linebreak")) return "ucd-linebreak";
  if (filename.includes("wordbreak")) return "ucd-wordbreak";
  if (filename.includes("sentencebreak")) return "ucd-sentencebreak";
  if (filename.includes("eastasianwidth")) return "ucd-eastasian";
  if (filename.includes("verticalorientation")) return "ucd-vertical";
  if (filename.includes("compositionexclusions")) return "ucd-composition";

  // Standard file types
  if (filename.endsWith(".xml")) return "xml";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".csv") || filename.endsWith(".tsv")) return "csv";

  // Default to plain text
  return "txt";
}

/**
 * Format a size in bytes to a human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "256 KB")
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
