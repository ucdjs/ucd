/**
 * Safely parses a JSON string into an object of type T.
 * Returns null if the parsing fails.
 *
 * @template T - The expected type of the parsed JSON
 * @param {string} content - The JSON string to parse
 * @returns {T | null} The parsed object of type T or null if parsing fails
 */
export function safeJsonParse<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch (err) {
    console.error("[safeJsonParse] Failed to parse JSON:", err);
    return null;
  }
}

export { createPathFilter, PRECONFIGURED_FILTERS } from "./filter";
export type { FilterFn, FilterOptions } from "./filter";
