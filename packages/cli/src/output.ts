/* eslint-disable no-console */
import farver from "farver/fast";

export const green = farver.green;
export const red = farver.red;
export const yellow = farver.yellow;
export const cyan = farver.cyan;
export const bold = farver.bold;
export const dim = farver.dim;

const BUG_REPORT_URL = "https://github.com/ucdjs/ucd/issues";
const DEFAULT_INDENT = 2;
const DEFAULT_DIVIDER_LENGTH = 40;
const DEFAULT_LABEL_WIDTH = 16;
const DEFAULT_MAX_LIST_ITEMS = 10;

export interface FailOptions {
  /**
   * Additional detail lines to display after the error message
   */
  details?: string[];

  /**
   * Whether to include the GitHub issues link for bug reports
   */
  bugReport?: boolean;
}

export interface KeyValueOptions {
  /**
   * Number of spaces to indent (default: 2)
   */
  indent?: number;

  /**
   * Width for the label column (default: 16)
   */
  labelWidth?: number;

  /**
   * Color function for the value (optional)
   */
  valueColor?: (s: string) => string;
}

export interface ListOptions {
  /**
   * Prefix for each item (default: "•")
   */
  prefix?: string;

  /**
   * Maximum number of items to show before truncating (default: 10)
   */
  maxItems?: number;

  /**
   * Number of spaces to indent (default: 2)
   */
  indent?: number;

  /**
   * Color function for items (optional)
   */
  itemColor?: (s: string) => string;
}

export interface Output {
  /**
   * Log a message to stdout (or stderr in JSON mode)
   */
  log: (...args: unknown[]) => void;

  /**
   * Log a warning message to stderr
   */
  warn: (...args: unknown[]) => void;

  /**
   * Log an error message to stderr
   */
  error: (...args: unknown[]) => void;

  /**
   * Output JSON data to stdout. Only use this for structured JSON output.
   * Always writes to stdout, regardless of JSON mode.
   */
  json: (data: unknown) => void;

  /**
   * Log a success message with green checkmark.
   * Silent in JSON mode.
   *
   * @example output.success("Store initialized successfully")
   * // Output: ✓ Store initialized successfully
   */
  success: (message: string) => void;

  /**
   * Log an error message with red X icon.
   * Silent in JSON mode.
   *
   * @example output.fail("File not found", { details: ["Path: /foo/bar"], bugReport: true })
   * // Output:
   * // ❌ Error: File not found
   * //   Path: /foo/bar
   * //   If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues
   */
  fail: (message: string, options?: FailOptions) => void;

  /**
   * Log a warning message with yellow warning icon.
   * Silent in JSON mode.
   *
   * @example output.warning("No versions selected")
   * // Output: ⚠ No versions selected
   */
  warning: (message: string) => void;

  /**
   * Log an informational message (neutral, no icon).
   * Silent in JSON mode.
   *
   * @example output.info("Starting sync operation...")
   */
  info: (message: string) => void;
}

let jsonMode = false;

/**
 * Centralized output utility for CLI commands.
 *
 * In JSON mode:
 * - `log` is redirected to stderr so only JSON goes to stdout
 * - `warn` and `error` always go to stderr
 * - `json` always writes to stdout
 * - `success`, `fail`, `warning`, `info` are silent (no output)
 *
 * This ensures that when `--json` is used, stdout contains only valid JSON
 * that can be piped to other tools.
 */
export const output: Output = {
  log: (...args: unknown[]) => {
    if (jsonMode) {
      console.error(...args);
    } else {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  json: (data: unknown) => {
    console.log(`${JSON.stringify(data, null, 2)}\n`);
  },
  success: (message: string) => {
    if (jsonMode) return;
    console.log(green(`✓ ${message}`));
  },
  fail: (message: string, options?: FailOptions) => {
    if (jsonMode) return;
    console.error(red(`\n❌ Error: ${message}`));
    if (options?.details) {
      for (const detail of options.details) {
        console.error(`  ${detail}`);
      }
    }
    if (options?.bugReport) {
      console.error(`\n  If you believe this is a bug, please report it at ${BUG_REPORT_URL}`);
    }
  },
  warning: (message: string) => {
    if (jsonMode) return;
    console.warn(yellow(`⚠ ${message}`));
  },
  info: (message: string) => {
    if (jsonMode) return;
    console.log(message);
  },
};

/**
 * Enable or disable JSON mode.
 * When enabled, `output.log` is redirected to stderr.
 *
 * @param enabled - Whether to enable JSON mode
 */
export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

/**
 * Check if JSON mode is currently enabled.
 */
export function isJsonMode(): boolean {
  return jsonMode;
}

/**
 * Create indentation string.
 *
 * @param spaces - Number of spaces (default: 2)
 * @returns Indentation string
 *
 * @example indent() // "  "
 * @example indent(4) // "    "
 */
export function indent(spaces: number = DEFAULT_INDENT): string {
  return " ".repeat(spaces);
}

/**
 * Print a section header with title and divider.
 * Silent in JSON mode.
 *
 * @param title - The header title
 *
 * @example header("UCD Store Information")
 * // Output:
 * //   UCD Store Information
 * //   ────────────────────────────────────────
 */
export function header(title: string): void {
  if (jsonMode) return;
  const ind = indent();
  console.log(`\n${ind}${bold(title)}`);
  console.log(`${ind}${dim("─".repeat(DEFAULT_DIVIDER_LENGTH))}\n`);
}

/**
 * Print a horizontal divider line.
 * Silent in JSON mode.
 *
 * @param length - Length of the divider (default: 40)
 * @param indentSpaces - Number of spaces to indent (default: 2)
 *
 * @example divider()
 * // Output:   ────────────────────────────────────────
 */
export function divider(length: number = DEFAULT_DIVIDER_LENGTH, indentSpaces: number = DEFAULT_INDENT): void {
  if (jsonMode) return;
  console.log(`${indent(indentSpaces)}${dim("─".repeat(length))}`);
}

/**
 * Print a key-value pair with aligned formatting.
 * Silent in JSON mode.
 *
 * @param key - The label/key
 * @param value - The value to display
 * @param options - Formatting options
 *
 * @example keyValue("Store Path", "/path/to/store", { valueColor: green })
 * // Output:   Store Path:      /path/to/store
 */
export function keyValue(key: string, value: string, options: KeyValueOptions = {}): void {
  if (jsonMode) return;
  const {
    indent: indentSpaces = DEFAULT_INDENT,
    labelWidth = DEFAULT_LABEL_WIDTH,
    valueColor,
  } = options;

  const label = `${key}:`.padEnd(labelWidth);
  const displayValue = valueColor ? valueColor(value) : value;
  console.log(`${indent(indentSpaces)}${bold(label)} ${displayValue}`);
}

/**
 * Print a list of items with optional truncation.
 * Silent in JSON mode.
 *
 * @param items - Array of items to display
 * @param options - List formatting options
 *
 * @example list(["file1.txt", "file2.txt"], { prefix: "+", itemColor: green })
 * // Output:
 * //   + file1.txt
 * //   + file2.txt
 *
 * @example list(manyFiles, { maxItems: 5 })
 * // Output:
 * //   • file1.txt
 * //   • file2.txt
 * //   ... and 20 more
 */
export function list(items: ({ name: string; filePath: string } | string)[], options: ListOptions = {}): void {
  if (jsonMode) return;
  const {
    prefix = "•",
    maxItems = DEFAULT_MAX_LIST_ITEMS,
    indent: indentSpaces = DEFAULT_INDENT,
    itemColor,
  } = options;

  const ind = indent(indentSpaces);
  const displayItems = items.slice(0, maxItems);

  for (const item of displayItems) {
    const displayItem = itemColor
      ? itemColor(
          typeof item === "string" ? item : item.filePath,
        )
      : (typeof item === "string" ? item : item.filePath);
    console.log(`${ind}${prefix} ${displayItem}`);
  }

  if (items.length > maxItems) {
    console.log(`${ind}${dim(`... and ${items.length - maxItems} more`)}`);
  }
}

/**
 * Print a blank line.
 * Silent in JSON mode.
 */
export function blankLine(): void {
  if (jsonMode) return;
  console.log("");
}

// ============================================================================
// Stats/Summary Formatters
// ============================================================================

/**
 * Format a count value with color.
 *
 * @param value - The numeric value
 * @param color - Color function to apply
 * @returns Colored string representation of the number
 *
 * @example coloredCount(42, green) // green("42")
 */
export function coloredCount(value: number, color: (s: string) => string): string {
  return color(String(value));
}

/**
 * Format a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "2.35s", "150ms")
 *
 * @example formatDuration(2350) // "2.35s"
 * @example formatDuration(150) // "150ms"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format a list of versions as a comma-separated string.
 *
 * @param versions - Array of version strings
 * @returns Formatted version list
 *
 * @example versionList(["16.0.0", "15.1.0"]) // "16.0.0, 15.1.0"
 */
export function versionList(versions: string[]): string {
  return versions.join(", ");
}

/**
 * Format bytes to human-readable size.
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB", "256 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${units[i]}`;
}

/**
 * Print a summary section with counts for downloaded/skipped/failed.
 * Silent in JSON mode.
 *
 * @param counts - Object containing count values
 * @param counts.downloaded - Number of files downloaded
 * @param counts.skipped - Number of files skipped
 * @param counts.failed - Number of files that failed
 *
 * @example printCounts({ downloaded: 100, skipped: 5, failed: 0 })
 */
export function printCounts(counts: { downloaded?: number; skipped?: number; failed?: number }): void {
  if (jsonMode) return;
  const ind = indent();

  if (counts.downloaded != null) {
    console.log(`${ind}Files downloaded: ${green(String(counts.downloaded))}`);
  }
  if (counts.skipped != null) {
    console.log(`${ind}Files skipped:    ${yellow(String(counts.skipped))}`);
  }
  if (counts.failed != null) {
    const failedColor = counts.failed > 0 ? red : (s: string) => s;
    console.log(`${ind}Files failed:     ${failedColor(String(counts.failed))}`);
  }
}
