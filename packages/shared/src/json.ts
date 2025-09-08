import { createDebugger } from "./debugger";

const debug = createDebugger("ucdjs:shared:json");

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
    debug?.("Failed to parse JSON", { content, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
