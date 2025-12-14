import type { PicomatchOptions } from "picomatch";
import picomatch from "picomatch";

/**
 * Default picomatch options used across the shared package.
 * These options ensure consistent glob matching behavior:
 * - `nocase: true` - Case-insensitive matching
 * - `dot: true` - Match dotfiles (files starting with `.`)
 */
export const DEFAULT_PICOMATCH_OPTIONS: PicomatchOptions = {
  nocase: true,
  dot: true,
} as const;

export interface GlobMatchOptions {
  /**
   * Whether matching should be case-insensitive.
   * @default true
   */
  nocase?: boolean;
  /**
   * Whether to match dotfiles.
   * @default true
   */
  dot?: boolean;
}

/**
 * Check if a string matches a glob pattern.
 * Uses case-insensitive matching by default.
 *
 * @param pattern - The glob pattern to match against (e.g., `*.txt`, `Uni*`, `*Data*`)
 * @param value - The string to test against the pattern
 * @param options - Optional configuration for matching behavior
 * @returns `true` if the value matches the pattern, `false` otherwise
 *
 * @example
 * ```ts
 * import { matchGlob } from '@ucdjs-internal/shared';
 *
 * // Match files by extension
 * matchGlob('*.txt', 'UnicodeData.txt'); // true
 * matchGlob('*.txt', 'readme.md'); // false
 *
 * // Match by prefix
 * matchGlob('Uni*', 'UnicodeData.txt'); // true
 * matchGlob('uni*', 'UnicodeData.txt'); // true (case-insensitive)
 *
 * // Match by substring
 * matchGlob('*Data*', 'UnicodeData.txt'); // true
 *
 * // Match multiple patterns with braces
 * matchGlob('*.{txt,xml}', 'data.txt'); // true
 * matchGlob('*.{txt,xml}', 'data.xml'); // true
 * ```
 */
export function matchGlob(pattern: string, value: string, options: GlobMatchOptions = {}): boolean {
  const {
    nocase = DEFAULT_PICOMATCH_OPTIONS.nocase,
    dot = DEFAULT_PICOMATCH_OPTIONS.dot,
  } = options;

  return picomatch.isMatch(value, pattern, {
    nocase,
    dot,
  } satisfies PicomatchOptions);
}

/**
 * Create a reusable glob matcher function for a given pattern.
 * This is more efficient when matching many values against the same pattern.
 *
 * @param pattern - The glob pattern to compile
 * @param options - Optional configuration for matching behavior
 * @returns A function that tests strings against the compiled pattern
 *
 * @example
 * ```ts
 * import { createGlobMatcher } from '@ucdjs-internal/shared';
 *
 * const matcher = createGlobMatcher('*.txt');
 * matcher('file.txt'); // true
 * matcher('file.md'); // false
 *
 * // Filter an array of filenames
 * const files = ['a.txt', 'b.md', 'c.txt'];
 * const txtFiles = files.filter(createGlobMatcher('*.txt'));
 * // ['a.txt', 'c.txt']
 * ```
 */
export function createGlobMatcher(pattern: string, options: GlobMatchOptions = {}): (value: string) => boolean {
  const {
    nocase = DEFAULT_PICOMATCH_OPTIONS.nocase,
    dot = DEFAULT_PICOMATCH_OPTIONS.dot,
  } = options;

  const isMatch = picomatch(pattern, {
    nocase,
    dot,
  } satisfies PicomatchOptions);

  return (value: string): boolean => isMatch(value);
}
