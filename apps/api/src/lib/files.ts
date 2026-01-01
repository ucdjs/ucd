import type { Entry } from "apache-autoindex-parse";
import { trimTrailingSlash } from "@luxass/utils";
import { parse } from "apache-autoindex-parse";

/**
 * Parses an HTML directory listing from Unicode.org and extracts file/directory entries.
 *
 * This function takes raw HTML content from a Unicode.org directory listing page
 * and converts it into a structured array of Entry objects containing metadata
 * about each file or subdirectory.
 *
 * @param {string} html - The raw HTML content from a Unicode.org directory listing page
 * @returns {Promise<Entry[]>} A promise that resolves to an array of Entry objects, each containing
 *          type, name, path, and lastModified information for files/directories
 *
 * @example
 * ```typescript
 * const html = await fetch('https://unicode.org/Public?F=2').then(r => r.text());
 * const entries = await parseUnicodeDirectory(html);
 * console.log(entries); // [{ type: 'directory', name: 'UNIDATA', path: '/UNIDATA', ... }]
 * ```
 */
export async function parseUnicodeDirectory(html: string, basePath = ""): Promise<Entry[]> {
  const files = parse(html, {
    format: "F2",
    basePath,
  });

  return files.map(({ type, name, path, lastModified }) => ({
    type,
    name: trimTrailingSlash(name),
    path: trimTrailingSlash(path),
    lastModified,
  }));
}
