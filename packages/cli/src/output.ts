/**
 * Output interface for CLI commands.
 * Provides a centralized way to handle output that respects JSON mode.
 */
export interface Output {
  /**
   * Log a message to stdout (or stderr in JSON mode)
   */
  log: (...args: unknown[]) => void;
  /**
   * Log an informational message to stdout (or stderr in JSON mode)
   */
  info: (...args: unknown[]) => void;
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
}

let jsonMode = false;

/**
 * Centralized output utility for CLI commands.
 *
 * In JSON mode:
 * - `log` and `info` are redirected to stderr so only JSON goes to stdout
 * - `warn` and `error` always go to stderr
 * - `json` always writes to stdout
 *
 * This ensures that when `--json` is used, stdout contains only valid JSON
 * that can be piped to other tools.
 */
export const output: Output = {
  log: (...args: unknown[]) => {
    if (jsonMode) {
      console.error(...args);
    } else {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (jsonMode) {
      console.error(...args);
    } else {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  json: (data: unknown) => {
    // eslint-disable-next-line no-console
    console.log(`${JSON.stringify(data, null, 2)}\n`);
  },
};

/**
 * Enable or disable JSON mode.
 * When enabled, `output.log` and `output.info` are redirected to stderr.
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
