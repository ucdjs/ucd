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

export type GlobMatchFn = (value: string) => boolean;

/**
 * Create a reusable glob matcher function for a given pattern.
 * This is more efficient when matching many values against the same pattern.
 *
 * @param {string} pattern - The glob pattern to compile
 * @param {GlobMatchOptions} options - Optional configuration for matching behavior
 * @returns {GlobMatchFn} A function that tests strings against the compiled pattern
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
export function createGlobMatcher(pattern: string, options: GlobMatchOptions = {}): GlobMatchFn {
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

/**
 * Maximum allowed length for glob patterns.
 * Helps prevent DoS attacks with extremely long patterns.
 */
export const MAX_PATTERN_LENGTH = 200;

/**
 * Maximum allowed nesting depth for braces/brackets.
 * Prevents exponential backtracking with deeply nested patterns.
 */
export const MAX_NESTING_DEPTH = 3;

/**
 * Maximum number of alternatives in brace expansion.
 * Prevents patterns like `{a,b,c,...}` with thousands of alternatives.
 */
export const MAX_BRACE_ALTERNATIVES = 5;

/**
 * Maximum consecutive wildcards allowed.
 * Prevents patterns like `*****` which can cause performance issues.
 */
export const MAX_CONSECUTIVE_WILDCARDS = 3;

/**
 * Validate if a string is a valid and safe glob pattern.
 * Checks for:
 * - Empty or whitespace-only patterns
 * - Excessively long patterns (DoS prevention)
 * - Deeply nested braces/brackets (ReDoS prevention)
 * - Too many brace alternatives (explosion prevention)
 * - Excessive consecutive wildcards
 * - Syntax errors (via picomatch compilation)
 *
 * @param {string} pattern - The glob pattern to validate
 * @returns {boolean} `true` if the pattern is valid and safe, `false` otherwise
 *
 * @example
 * ```ts
 * import { isValidGlobPattern } from '@ucdjs-internal/shared';
 *
 * // Valid patterns
 * isValidGlobPattern('*.txt'); // true
 * isValidGlobPattern('file[123].txt'); // true
 * isValidGlobPattern('*.{txt,xml}'); // true
 *
 * // Invalid patterns
 * isValidGlobPattern('file[123.txt'); // false - unclosed bracket
 * isValidGlobPattern('*.{txt,xml'); // false - unclosed brace
 * isValidGlobPattern(''); // false - empty pattern
 *
 * // Potentially malicious patterns
 * isValidGlobPattern('*'.repeat(100)); // false - too many wildcards
 * isValidGlobPattern('a'.repeat(1000)); // false - too long
 * isValidGlobPattern('{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y}'); // false - too many alternatives
 * ```
 */
export function isValidGlobPattern(pattern: string): boolean {
  // Empty patterns are invalid
  if (!pattern || pattern.trim().length === 0) {
    return false;
  }

  // Check pattern length
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return false;
  }

  // Check for excessive consecutive wildcards (e.g., "****")
  const consecutiveWildcardMatch = pattern.match(/\*+/g);
  if (consecutiveWildcardMatch) {
    for (const match of consecutiveWildcardMatch) {
      // Allow ** for globstar, but not more than MAX_CONSECUTIVE_WILDCARDS
      if (match.length > MAX_CONSECUTIVE_WILDCARDS) {
        return false;
      }
    }
  }

  // Check nesting depth and brace alternatives
  let depth = 0;
  let maxDepth = 0;
  let braceAlternatives = 0;
  let inBrace = false;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const prevChar = i > 0 ? pattern[i - 1] : "";

    // Skip escaped characters
    if (prevChar === "\\") {
      continue;
    }

    switch (char) {
      case "{":
      case "[":
      case "(":
        depth++;
        maxDepth = Math.max(maxDepth, depth);
        if (char === "{") {
          inBrace = true;
          braceAlternatives = 1; // Start counting alternatives
        }
        break;
      case "}":
      case "]":
      case ")":
        depth--;
        if (char === "}") {
          inBrace = false;
        }
        // Unbalanced brackets
        if (depth < 0) {
          return false;
        }
        break;
      case ",":
        if (inBrace) {
          braceAlternatives++;
          if (braceAlternatives > MAX_BRACE_ALTERNATIVES) {
            return false;
          }
        }
        break;
    }
  }

  // Check for unclosed brackets
  if (depth !== 0) {
    return false;
  }

  // Check max nesting depth
  if (maxDepth > MAX_NESTING_DEPTH) {
    return false;
  }

  // Try to compile the pattern - picomatch will throw on invalid patterns
  try {
    picomatch(pattern);
    return true;
  } catch {
    return false;
  }
}
