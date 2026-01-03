import type { MockStoreNode } from "../types";
import { HttpResponse } from "../../msw";
import { addPathsToFileNodes } from "../add-paths";
import { defineMockRouteHandler } from "../define";

// Aligns with files handler: always return contents of the synthetic "ucd" folder
// and keep paths prefixed with /{version}/ucd/...
function normalizeFileTree(nodes: MockStoreNode[]): { nodes: MockStoreNode[]; basePath: string } {
  if (
    nodes.length === 1
    && nodes[0]?.type === "directory"
    && nodes[0]?.name === "ucd"
  ) {
    return { nodes: (nodes[0].children ?? []) as MockStoreNode[], basePath: "ucd" };
  }

  // Even without an explicit ucd directory, we still prefix paths with "ucd"
  return { nodes, basePath: "ucd" };
}

export const fileTreeRoute = defineMockRouteHandler({
  endpoint: "/api/v1/versions/{version}/file-tree",
  setup: ({
    url,
    providedResponse,
    shouldUseDefaultValue,
    mockFetch,
    files,
  }) => {
    if (typeof providedResponse === "function") {
      mockFetch([
        ["GET", url, providedResponse],
      ]);
      return;
    }

    mockFetch([
      ["GET", url, ({ params }) => {
        if (shouldUseDefaultValue) {
          const version = params.version as string;

          const useWildcardOnly = Object.keys(files).length === 1 && Object.keys(files)[0] === "*";

          // Prefer version-specific data; fall back to wildcard; then nothing
          const filesData = useWildcardOnly
            ? files["*"]
            : files[version] || files["*"];

          if (!filesData) {
            return HttpResponse.json([]);
          }

          const { nodes, basePath } = normalizeFileTree(filesData);
          const filesWithPaths = addPathsToFileNodes(nodes, version, basePath || undefined);
          return HttpResponse.json(filesWithPaths);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
