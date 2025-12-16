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
export const MAX_GLOB_EXTGLOB_DEPTH = 3;
export const MAX_GLOB_STARS = 32;
export const MAX_GLOB_QUESTIONS = 32;

const EXTGLOB_PREFIXES = new Set(["!", "@", "+", "?", "*"]);

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
  let expansions = 0;
  let braceDepth = 0;
  let optionsInBrace = 0;

  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern.charAt(i);

    if (ch === "\\") {
      i += 1;
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      if (braceDepth === 1) optionsInBrace = 1;
    } else if (ch === "}") {
      if (braceDepth === 0) return { expansions, valid: false };
      braceDepth -= 1;
      if (braceDepth === 0) {
        expansions += optionsInBrace;
        optionsInBrace = 0;
      }
    } else if (ch === "," && braceDepth === 1) {
      optionsInBrace += 1;
    }
  }

  if (braceDepth !== 0) return { expansions, valid: false };
  return { expansions, valid: true };
}

function analyzeExtglobDepth(pattern: string): { depth: number; valid: boolean } {
  let depth = 0;
  let maxDepth = 0;

  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern.charAt(i);

    if (ch === "\\") {
      i += 1;
      continue;
    }

    if (i + 1 < pattern.length) {
      const next = pattern.charAt(i + 1);
      if (EXTGLOB_PREFIXES.has(ch) && next === "(") {
        depth += 1;
        maxDepth = Math.max(maxDepth, depth);
        i += 1; // skip "("
        continue;
      }
    }

    if (ch === ")") {
      if (depth === 0) return { depth: maxDepth, valid: false };
      depth -= 1;
    }
  }

  if (depth !== 0) return { depth: maxDepth, valid: false };
  return { depth: maxDepth, valid: true };
}

export interface GlobValidationLimits {
  maxLength?: number;
  maxSegments?: number;
  maxBraceExpansions?: number;
  maxExtglobDepth?: number;
  maxStars?: number;
  maxQuestions?: number;
}

export function isValidGlobPattern(pattern: string, limits: GlobValidationLimits = {}): boolean {
  const {
    maxLength = MAX_GLOB_LENGTH,
    maxSegments = MAX_GLOB_SEGMENTS,
    maxBraceExpansions = MAX_GLOB_BRACE_EXPANSIONS,
    maxExtglobDepth = MAX_GLOB_EXTGLOB_DEPTH,
    maxStars = MAX_GLOB_STARS,
    maxQuestions = MAX_GLOB_QUESTIONS,
  } = limits;

  if (typeof pattern !== "string") return false;
  if (pattern.length === 0) return false;
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

  const { depth: extDepth, valid: extValid } = analyzeExtglobDepth(pattern);
  if (!extValid) return false;
  if (extDepth > maxExtglobDepth) return false;

  try {
    picomatch.scan(pattern);
    return true;
  } catch {
    return false;
  }
}
