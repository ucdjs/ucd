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

// Increased length for flexibility, but still a hard limit.
export const MAX_PATTERN_LENGTH = 100;

// Limits for complexity and DoS prevention
export const MAX_SINGLE_WILDCARDS = 5;
export const MAX_CONSECUTIVE_WILDCARDS = 3;
export const MAX_NESTING_DEPTH = 1; // Crucial: 1 allows top-level {a,b}, 0 blocks all.
export const MAX_BRACE_ALTERNATIVES = 10; // Increased tolerance slightly
export const BLOCK_RECURSIVE_WILDCARD = false; // Blocks '**'
export const BLOCK_PATH_TRAVERSAL = true; // Blocks '..'
export const BLOCK_DANGEROUS_SEQUENCES = true;

/**
 * Performs a deep structural analysis of the pattern to check for nested brace expansions.
 * This is a highly effective DoS guard against exponential backtracking.
 * @param {string} pattern The glob pattern string.
 * @param {number} maxNestingLevel The maximum allowed nesting depth (1 allows top-level only).
 * @returns `true` if nesting is too deep or the pattern is unbalanced, `false` otherwise.
 */
function hasExcessiveNesting(pattern: string, maxNestingLevel: number): boolean {
  let currentNesting = 0;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    // Skip characters inside character sets [...]
    if (char === "[") {
      const endBracket = pattern.indexOf("]", i + 1);
      if (endBracket !== -1) {
        i = endBracket;
        continue;
      }
    }

    if (char === "{") {
      currentNesting++;
      if (currentNesting > maxNestingLevel) {
        return true;
      }
    } else if (char === "}") {
      if (currentNesting > 0) {
        currentNesting--;
      } else {
        return true; // Unmatched '}'
      }
    }
  }

  // Check for unbalanced braces (unmatched '{')
  return currentNesting !== 0;
}

/**
 * Validates if a string is a valid and safe glob pattern.
 * Prioritizes custom quantitative and structural checks to prevent DoS/ReDoS
 * before attempting picomatch compilation.
 *
 * @param {string} pattern - The glob pattern to validate
 * @returns {boolean} `true` if the pattern is safe, `false` otherwise
 */
export function isValidGlobPattern(pattern: string): boolean {
  // 1. Empty/Whitespace Check
  if (!pattern || pattern.trim().length === 0) {
    return false;
  }

  // 2. Length Check (DoS)
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return false;
  }

  // 3. Structural Complexity Check (Nested Braces)
  if (hasExcessiveNesting(pattern, MAX_NESTING_DEPTH)) {
    return false;
  }

  // 4. Quantitative Limits & Traversal Guards

  // Path Traversal '..'
  if (BLOCK_PATH_TRAVERSAL && pattern.includes("..")) {
    return false;
  }

  // Recursive Wildcard '**'
  if (BLOCK_RECURSIVE_WILDCARD && pattern.includes("**")) {
    return false;
  }

  // Simple Wildcard Count '*'
  const singleWildcardCount = (pattern.match(/(?<!\*)\*(?!\*)/g) || []).length;
  if (singleWildcardCount > MAX_SINGLE_WILDCARDS) {
    return false;
  }

  // Consecutive Wildcards (e.g., '****')
  // Match three or more stars.
  if (pattern.match(new RegExp(`\\*{${MAX_CONSECUTIVE_WILDCARDS},}`, "g"))) {
    return false;
  }

  // Brace Alternatives (Approximation: count the commas inside braces)
  const braceContentMatch = pattern.match(/\{([^}]+)\}/g) || [];
  for (const match of braceContentMatch) {
    const alternatives = match.split(",").length;
    if (alternatives > MAX_BRACE_ALTERNATIVES) {
      return false;
    }
  }

  // 5. Hard ReDoS Sequence Guard (NEW)
  // This blocks patterns known to generate complex backtracking state machines.
  // E.g., repeating groups that can match the same string in multiple ways.
  if (BLOCK_DANGEROUS_SEQUENCES) {
    // Examples: `(*a|*b)*` or `(a|a)+`
    // We check for simplified glob equivalents known to be problematic.
    if (pattern.includes("*|*") || pattern.includes("(*|*)") || pattern.includes("(?|?)")) {
      return false;
    }
  }

  // 6. Wide Traversal Guard (e.g., '/*files.txt' or 'dir/*/')
  if (pattern.includes("/*") || pattern.includes("*/")) {
    return false;
  }

  // 7. Hidden File Wildcard Check (e.g., '.*')
  if (pattern.includes(".*") && !pattern.startsWith("./.") && !pattern.startsWith(".")) {
    return false;
  }

  // If the pattern passed all structural/quantitative guards, we now allow picomatch
  // to perform the final syntax check. This is generally safer than relying solely on picomatch
  // for ReDoS prevention.
  try {
    picomatch(pattern, DEFAULT_PICOMATCH_OPTIONS);
    return true;
  } catch {
    // Syntax error detected by picomatch
    return false;
  }
}
