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

export async function fetchWithRetry(url: string, retries: number = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === retries) {
        throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts: ${error}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
    }
  }
  throw new Error(`Unexpected error in fetchWithRetry`);
}
