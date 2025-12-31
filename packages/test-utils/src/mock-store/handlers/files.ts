import { findFileByPath } from "@ucdjs-internal/shared";
import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

interface FileNode {
  type: string;
  name: string;
  path?: string;
  children?: FileNode[];
  _content?: string;
}

/**
 * Strips the `_content` and `children` properties from file nodes.
 * This is used to return clean JSON responses that match the API schema,
 * where directory listings show flat entries without nested children.
 */
function stripContent<T extends FileNode>(nodes: T[]): Omit<T, "_content" | "children">[] {
  return nodes.map((node) => {
    const { _content, children: _children, ...rest } = node;
    return rest as Omit<T, "_content" | "children">;
  });
}

/**
 * Strips the "ucd" segment from a file path if present.
 * The real API uses paths like `<version>/ucd/<file>` for modern Unicode versions,
 * but the mock files are defined without the "ucd" prefix.
 *
 * Examples:
 * - "ucd/UnicodeData.txt" -> "UnicodeData.txt"
 * - "ucd/auxiliary/GraphemeBreakProperty.txt" -> "auxiliary/GraphemeBreakProperty.txt"
 * - "UnicodeData.txt" -> "UnicodeData.txt" (no change)
 */
function stripUcdPrefix(filePath: string): string {
  if (filePath.startsWith("ucd/")) {
    return filePath.slice(4);
  }
  return filePath;
}

export const filesRoute = defineMockRouteHandler({
  endpoint: "/api/v1/files/{wildcard}",
  setup: ({
    url,
    providedResponse,
    mockFetch,
    shouldUseDefaultValue,
    files,
  }) => {
    if (typeof providedResponse === "function") {
      mockFetch([
        [["GET", "HEAD"], url, providedResponse],
      ]);
      return;
    }

    mockFetch([
      [["GET", "HEAD"], url, ({ params }) => {
        if (shouldUseDefaultValue) {
          const wildcard = params.wildcard as string;
          // Extract version and file path from wildcard (e.g., "16.0.0/ucd/UnicodeData.txt")
          const [version, ...pathParts] = wildcard.split("/");
          const rawFilePath = pathParts.join("/");

          // Strip the "ucd" segment from the path if present
          // The real API uses `<version>/ucd/<file>` paths, but mock files
          // are defined relative to the ucd folder (e.g., "UnicodeData.txt")
          const filePath = stripUcdPrefix(rawFilePath);

          // Get files for this version, or fall back to "*"
          const versionFiles = (version ? files[version] : undefined) ?? files["*"];

          if (versionFiles && Array.isArray(versionFiles)) {
            // If no path specified, return the root files for this version
            if (!filePath) {
              const stripped = stripContent(versionFiles as FileNode[]);
              return HttpResponse.json(stripped);
            }

            // Find the file/directory node that matches the path
            const fileNode = findFileByPath(versionFiles as FileNode[], filePath);

            // If it's a directory, return its children (or empty array)
            if (fileNode && fileNode.type === "directory") {
              const stripped = stripContent(fileNode.children ?? []);
              return HttpResponse.json(stripped);
            }

            // If it's a file with _content, return the content
            if (fileNode && "_content" in fileNode && typeof fileNode._content === "string") {
              return HttpResponse.text(fileNode._content);
            }

            // If file found but no _content, return the filename
            if (fileNode) {
              return HttpResponse.text(fileNode.name);
            }
          }

          return HttpResponse.text("This is a default file response.");
        }

        if (providedResponse instanceof ArrayBuffer || providedResponse instanceof Uint8Array) {
          return new HttpResponse(providedResponse, { headers: { "Content-Type": "application/octet-stream" } });
        }

        if (
          (typeof Blob !== "undefined" && providedResponse instanceof Blob)
          || (typeof File !== "undefined" && providedResponse instanceof File)
        ) {
          return new HttpResponse(providedResponse, { headers: { "Content-Type": "application/octet-stream" } });
        }

        if (typeof providedResponse === "string") {
          return HttpResponse.text(providedResponse);
        }

        // For FileEntryList or other objects
        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
