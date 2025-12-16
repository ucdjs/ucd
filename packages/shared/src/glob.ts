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

export const MAX_GLOB_LENGTH = 256;
export const MAX_GLOB_SEGMENTS = 16;
export const MAX_GLOB_BRACE_EXPANSIONS = 24;
export const MAX_GLOB_STARS = 32;
export const MAX_GLOB_QUESTIONS = 32;

function countWildcards(pattern: string): { stars: number; questions: number } {
  let stars = 0;
  let questions = 0;

  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern.charAt(i);

    if (ch === "\\") {
      i += 1;
      continue;
    }

    if (ch === "*") stars += 1;
    if (ch === "?") questions += 1;
  }

  return { stars, questions };
}

function analyzeBraces(pattern: string): { expansions: number; valid: boolean } {
  let braceDepth = 0;
  // Track sequential top-level brace groups for multiplicative expansion
  const topLevelGroups: number[] = [];
  // Track top-level options and their nested expansions
  const topLevelOptions: Array<{ base: number; nestedMultiplier: number }> = [];
  let currentNestedStack: number[] = [];

  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern.charAt(i);

    if (ch === "\\") {
      i += 1;
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      if (braceDepth === 1) {
        // Starting a new top-level brace group
        topLevelOptions.push({ base: 1, nestedMultiplier: 1 });
        currentNestedStack = [];
      } else {
        // Starting a nested brace group
        currentNestedStack.push(1);
      }
    } else if (ch === "}") {
      if (braceDepth === 0) return { expansions: 0, valid: false };
      braceDepth -= 1;
      if (braceDepth === 0) {
        // Completed a top-level brace group
        // Calculate total expansions: sum of (base * nestedMultiplier) for each option
        let totalExpansions = 0;
        for (const option of topLevelOptions) {
          totalExpansions += option.base * option.nestedMultiplier;
        }
        topLevelGroups.push(totalExpansions);
        topLevelOptions.length = 0;
        currentNestedStack = [];
      } else {
        // Completed a nested brace group
        if (currentNestedStack.length > 0) {
          const nestedCount = currentNestedStack.pop()!;
          if (currentNestedStack.length > 0) {
            // Multiply with parent nested group
            currentNestedStack[currentNestedStack.length - 1]! *= nestedCount;
          } else if (topLevelOptions.length > 0) {
            // This nested group belongs to the current top-level option
            topLevelOptions[topLevelOptions.length - 1]!.nestedMultiplier *= nestedCount;
          }
        }
      }
    } else if (ch === ",") {
      if (braceDepth === 1) {
        // Count options only at top level
        topLevelOptions.push({ base: 1, nestedMultiplier: 1 });
      } else if (braceDepth > 1) {
        // Count options in nested braces
        if (currentNestedStack.length > 0) {
          currentNestedStack[currentNestedStack.length - 1]! += 1;
        }
      }
    }
  }

  if (braceDepth !== 0) return { expansions: 0, valid: false };

  // Calculate multiplicative expansion for sequential brace groups
  // If there are no brace groups, return 0 (no expansions)
  if (topLevelGroups.length === 0) {
    return { expansions: 0, valid: true };
  }

  // Multiply all sequential top-level brace groups
  const expansions = topLevelGroups.reduce((product, count) => product * count, 1);
  return { expansions, valid: true };
}

export interface GlobValidationLimits {
  maxLength?: number;
  maxSegments?: number;
  maxBraceExpansions?: number;
  maxStars?: number;
  maxQuestions?: number;
}

export function isValidGlobPattern(pattern: string, limits: GlobValidationLimits = {}): boolean {
  const {
    maxLength = MAX_GLOB_LENGTH,
    maxSegments = MAX_GLOB_SEGMENTS,
    maxBraceExpansions = MAX_GLOB_BRACE_EXPANSIONS,
    maxStars = MAX_GLOB_STARS,
    maxQuestions = MAX_GLOB_QUESTIONS,
  } = limits;

  if (typeof pattern !== "string") return false;
  if (pattern.length === 0) return false;
  if (pattern.trim().length === 0) return false;
  if (pattern.length > maxLength) return false;
  if (pattern.includes("\0")) return false;

  const segments = pattern.split(/[/\\]+/).filter(Boolean);
  if (segments.length > maxSegments) return false;

  const { stars, questions } = countWildcards(pattern);
  if (stars > maxStars) return false;
  if (questions > maxQuestions) return false;

  const { expansions, valid: braceValid } = analyzeBraces(pattern);
  if (!braceValid) return false;
  if (expansions > maxBraceExpansions) return false;

  try {
    picomatch.scan(pattern);
    return true;
  } catch {
    return false;
  }
}
