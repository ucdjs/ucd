import type { MockStoreNode } from "../types";
import { findFileByPath } from "@ucdjs-internal/shared";
import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

/**
 * Strips the `_content` and `children` properties from file nodes.
 * This is used to return clean JSON responses that match the API schema,
 * where directory listings show flat entries without nested children.
 */
function omitChildrenAndContent<T extends MockStoreNode>(nodes: T[]): Omit<T, "_content" | "children">[] {
  return nodes.map((node) => {
    const { _content, children: _children, ...rest } = node as any;
    return rest as Omit<T, "_content" | "children">;
  });
}

const DEFAULT_FILE_RESPONSE_CONTENT = "This is a default file response.";
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
          // TODO: Handle cases where we request `/api/v1/files/test.txt`.
          const [version, ...pathParts] = wildcard.split("/");
          const filePath = pathParts.join("/");

          // Get files for this version, or fall back to "*"
          const versionFiles = (version ? files[version] : undefined) ?? files["*"];

          if (versionFiles != null && Array.isArray(versionFiles)) {
            // If no path specified, return the root files for this version
            if (!filePath) {
              const stripped = omitChildrenAndContent(versionFiles);
              return HttpResponse.json(stripped);
            }

            // Find the file/directory node that matches the path
            const fileNode = findFileByPath(versionFiles, `/${version}/${filePath}`);

            // If it's a directory, return its children (or empty array)
            if (fileNode && fileNode.type === "directory") {
              const stripped = omitChildrenAndContent(fileNode.children ?? []);
              return HttpResponse.json(stripped);
            }

            // If it's a file with _content, return the content
            if (fileNode && "_content" in fileNode && typeof fileNode._content === "string") {
              return HttpResponse.text(fileNode._content);
            }

            // If file found but no _content, return the filename
            if (fileNode) {
              console.warn(`Mock store: File "${filePath}" found but has no _content. Returning default response content.`);
              return HttpResponse.text(DEFAULT_FILE_RESPONSE_CONTENT);
            }
          }

          return HttpResponse.text(DEFAULT_FILE_RESPONSE_CONTENT);
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
