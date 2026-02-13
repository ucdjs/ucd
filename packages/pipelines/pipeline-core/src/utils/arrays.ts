/**
 * Split a line into exactly 2 fields.
 * Returns a tuple [first, second] or null if not enough fields.
 *
 * After null check, TypeScript knows both elements exist and are strings.
 */
export function splitTwoFields(
  line: string,
  delimiter: string,
): [string, string] | null {
  const parts = line.split(delimiter);
  if (parts.length < 2) return null;
  return [parts[0]!, parts[1]!];
}

/**
 * Split a line with minimum field count check.
 * Returns the array or null if not enough fields.
 *
 * Use when you need more than 2 fields (e.g., UnicodeData with 14 fields).
 * Access fields with nullish coalescing: `fields[0] ?? ""`
 */
export function splitMinFields(
  line: string,
  delimiter: string,
  minFields: number,
): string[] | null {
  const parts = line.split(delimiter);
  return parts.length >= minFields ? parts : null;
}
