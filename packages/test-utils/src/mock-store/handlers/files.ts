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
          const filePath = pathParts.join("/");

          // Get files for this version, or fall back to "*"
          const versionFiles = (version ? files[version] : undefined) ?? files["*"];

          if (versionFiles && Array.isArray(versionFiles)) {
            // Find the file node that matches the path
            const fileNode = findFileByPath(versionFiles as FileNode[], filePath);

            if (fileNode && "_content" in fileNode && typeof fileNode._content === "string") {
              return HttpResponse.text(fileNode._content);
            }

            // If file found but no _content, return the filename
            if (fileNode) {
              return HttpResponse.text(fileNode.name);
            }
          }

          // Fallback: return the filename as content
          const name = wildcard.split("/").pop() ?? wildcard;
          return HttpResponse.text(name);
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
