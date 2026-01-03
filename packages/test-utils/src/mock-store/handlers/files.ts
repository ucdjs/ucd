import type { ApiError } from "@ucdjs/schemas";
import type { MockStoreNode, MockStoreNodeWithPath } from "../types";
import { findFileByPath } from "@ucdjs-internal/shared";
import {
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { HttpResponse } from "../../msw";
import { addPathsToFileNodes } from "../add-paths";
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
          const wildcard = (params.wildcard as string) || "";

          // Extract version and file path from wildcard (e.g., "16.0.0/ucd/UnicodeData.txt")
          const [firstPart, ...pathParts] = wildcard.split("/");

          // Check if the first part is a valid version key in files
          const isVersionKey = firstPart && firstPart in files;

          let version = "";
          let filePath: string;
          let versionFiles: MockStoreNodeWithPath[] = [];
          let lookupPath: string;

          // Determine which files to use based on the request path
          // If the first part is a version key, use that version's files
          // Otherwise fall back to wildcard ("*") which serves as a default for all versions
          // For root paths without a version prefix, use the "root" entry
          if (isVersionKey || (firstPart && files["*"])) {
            version = firstPart;
            filePath = pathParts.join("/");
            const versionFilesRaw = files[firstPart] || files["*"];

            if (!versionFilesRaw || !Array.isArray(versionFilesRaw)) {
              return HttpResponse.text(DEFAULT_FILE_RESPONSE_CONTENT);
            }

            // Build file tree with version-prefixed paths and "ucd" subdirectory (e.g., /16.0.0/ucd/file.txt)
            versionFiles = addPathsToFileNodes(versionFilesRaw, version, "ucd");
            lookupPath = filePath ? `/${version}/${filePath}` : "";
          } else {
            filePath = wildcard;
            const rootFilesRaw = files.root;

            if (!rootFilesRaw || !Array.isArray(rootFilesRaw)) {
              return HttpResponse.text(DEFAULT_FILE_RESPONSE_CONTENT);
            }

            // Build file tree without version or subdirectory prefix (e.g., /test.txt)
            versionFiles = addPathsToFileNodes(rootFilesRaw, "", "");
            lookupPath = filePath ? `/${filePath}` : "";
          }

          // If no specific path requested, return the listing of root-level files for this context
          if (!lookupPath) {
            // For versioned requests, expose the synthetic "ucd" directory at the top level
            // so that listing "/{version}" yields just that folder.
            if (version) {
              const ucdDir: MockStoreNodeWithPath = {
                type: "directory",
                name: "ucd",
                path: `/${version}/ucd`,
                lastModified: 0,
                children: [],
              };
              const stripped = omitChildrenAndContent([ucdDir]);
              return HttpResponse.json(stripped, {
                headers: {
                  [UCD_STAT_TYPE_HEADER]: "directory",
                  [UCD_STAT_CHILDREN_HEADER]: "1",
                  [UCD_STAT_CHILDREN_FILES_HEADER]: "0",
                  [UCD_STAT_CHILDREN_DIRS_HEADER]: "1",
                },
              });
            }

            const stripped = omitChildrenAndContent(versionFiles);
            return HttpResponse.json(stripped, {
              headers: {
                [UCD_STAT_TYPE_HEADER]: "directory",
                [UCD_STAT_CHILDREN_HEADER]: `${stripped.length}`,
                [UCD_STAT_CHILDREN_FILES_HEADER]: `${stripped.filter((f) => f.type === "file").length}`,
                [UCD_STAT_CHILDREN_DIRS_HEADER]: `${stripped.filter((f) => f.type === "directory").length}`,
              },
            });
          }

          // Special-case the synthetic "ucd" directory: it's implicit in the generated paths
          // for versioned requests, so listing "/{version}/ucd" should return the top-level files.
          if (version && filePath === "ucd") {
            const stripped = omitChildrenAndContent(versionFiles);
            return HttpResponse.json(stripped, {
              headers: {
                [UCD_STAT_TYPE_HEADER]: "directory",
                [UCD_STAT_CHILDREN_HEADER]: `${stripped.length}`,
                [UCD_STAT_CHILDREN_FILES_HEADER]: `${stripped.filter((f) => f.type === "file").length}`,
                [UCD_STAT_CHILDREN_DIRS_HEADER]: `${stripped.filter((f) => f.type === "directory").length}`,
              },
            });
          }

          // Locate the requested file or directory within the tree
          const fileNode = findFileByPath(versionFiles, lookupPath);

          // If it's a directory, return its children (or empty array)
          if (fileNode && fileNode.type === "directory") {
            const stripped = omitChildrenAndContent(fileNode.children ?? []);
            return HttpResponse.json(stripped, {
              headers: {
                [UCD_STAT_TYPE_HEADER]: "directory",
                [UCD_STAT_CHILDREN_HEADER]: `${stripped.length}`,
                [UCD_STAT_CHILDREN_FILES_HEADER]: `${stripped.filter((f) => f.type === "file").length}`,
                [UCD_STAT_CHILDREN_DIRS_HEADER]: `${stripped.filter((f) => f.type === "directory").length}`,
              },
            });
          }

          // If it's a file with _content, return the content
          if (fileNode && "_content" in fileNode && typeof fileNode._content === "string") {
            const content = fileNode._content;
            return HttpResponse.text(content, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                [UCD_STAT_TYPE_HEADER]: "file",
                [UCD_STAT_SIZE_HEADER]: `${new TextEncoder().encode(content).length}`,
              },
            });
          }

          // If file found but no _content, return the filename
          if (fileNode) {
            console.warn(`Mock store: File "${filePath}" found but has no _content. Returning default response content.`);
            return HttpResponse.text(DEFAULT_FILE_RESPONSE_CONTENT);
          }

          return HttpResponse.json({
            message: "Resource not found",
            status: 404,
            timestamp: new Date().toISOString(),
          } satisfies ApiError, { status: 404 });
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
